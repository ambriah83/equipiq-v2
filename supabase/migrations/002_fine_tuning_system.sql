-- Fine-tuning and feedback system tables

-- User feedback on AI responses
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  helpful BOOLEAN,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Improvement cases for bad responses
CREATE TABLE improvement_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID REFERENCES feedback(id) ON DELETE CASCADE,
  original_query TEXT NOT NULL,
  original_response TEXT NOT NULL,
  suggested_response TEXT,
  equipment_model_id UUID REFERENCES equipment_models(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fine-tuning jobs
CREATE TABLE fine_tuning_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  base_model TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'running', 'completed', 'failed')),
  trained_on_tags TEXT[],
  training_examples_count INTEGER DEFAULT 0,
  openai_job_id TEXT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training examples for fine-tuning
CREATE TABLE training_examples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  improvement_case_id UUID REFERENCES improvement_cases(id),
  equipment_model_id UUID REFERENCES equipment_models(id),
  system_prompt TEXT NOT NULL,
  user_prompt TEXT NOT NULL,
  assistant_response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Models created from fine-tuning
CREATE TABLE ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fine_tuning_job_id UUID REFERENCES fine_tuning_jobs(id),
  openai_model_id TEXT,
  name TEXT NOT NULL,
  accuracy FLOAT,
  cost_per_1k_tokens FLOAT,
  avg_latency_ms INTEGER,
  is_live BOOLEAN DEFAULT FALSE,
  evaluation_results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Golden test set for evaluation
CREATE TABLE evaluation_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_model_id UUID REFERENCES equipment_models(id),
  query TEXT NOT NULL,
  expected_response TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model evaluation results
CREATE TABLE model_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_model_id UUID REFERENCES ai_models(id),
  test_case_id UUID REFERENCES evaluation_test_cases(id),
  model_response TEXT NOT NULL,
  similarity_score FLOAT,
  passed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX feedback_message_id_idx ON feedback(message_id);
CREATE INDEX feedback_rating_idx ON feedback(rating);
CREATE INDEX improvement_cases_status_idx ON improvement_cases(status);
CREATE INDEX fine_tuning_jobs_status_idx ON fine_tuning_jobs(status);
CREATE INDEX ai_models_is_live_idx ON ai_models(is_live);

-- RLS Policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fine_tuning_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;

-- Users can create feedback for their own messages
CREATE POLICY "Users can create feedback for own messages" ON feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = feedback.message_id
      AND c.user_id = auth.uid()
    )
  );

-- Admin only policies for fine-tuning system
CREATE POLICY "Admin can manage improvement cases" ON improvement_cases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND email = 'ambriahatcher@gmail.com'
    )
  );

CREATE POLICY "Admin can manage fine-tuning jobs" ON fine_tuning_jobs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.uid() = id
      AND email = 'ambriahatcher@gmail.com'
    )
  );

-- Function to automatically create improvement cases for low ratings
CREATE OR REPLACE FUNCTION create_improvement_case_for_low_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- If rating is 1 or 2, automatically create an improvement case
  IF NEW.rating <= 2 THEN
    INSERT INTO improvement_cases (
      feedback_id,
      original_query,
      original_response,
      equipment_model_id,
      status
    )
    SELECT
      NEW.id,
      m.content as original_query,
      (SELECT content FROM messages WHERE conversation_id = m.conversation_id AND role = 'assistant' AND id > m.id ORDER BY created_at ASC LIMIT 1) as original_response,
      c.equipment_model_id,
      'pending'
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE m.id = NEW.message_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_create_improvement_case
  AFTER INSERT ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION create_improvement_case_for_low_rating();