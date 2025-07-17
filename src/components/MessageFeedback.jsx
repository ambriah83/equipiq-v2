import React, { useState, useEffect } from 'react';

const StarIcon = ({ filled, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
  </svg>
);

const ThumbsUpIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
  </svg>
);

const ThumbsDownIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
  </svg>
);

const MessageFeedback = ({ messageId, supabase, onFeedback }) => {
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [helpful, setHelpful] = useState(null);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  // Check if feedback already exists
  useEffect(() => {
    checkExistingFeedback();
  }, [messageId]);

  const checkExistingFeedback = async () => {
    if (!supabase || !messageId) return;
    
    try {
      const { data } = await supabase
        .from('feedback')
        .select('rating, helpful')
        .eq('message_id', messageId)
        .single();
      
      if (data) {
        setRating(data.rating || 0);
        setHelpful(data.helpful);
        setSubmitted(true);
      }
    } catch (error) {
      // No existing feedback
    }
  };

  const submitFeedback = async () => {
    if (!supabase || !messageId || submitted) return;

    try {
      const { error } = await supabase
        .from('feedback')
        .insert({
          message_id: messageId,
          rating: rating,
          helpful: helpful,
          comment: comment.trim() || null
        });

      if (!error) {
        setSubmitted(true);
        setShowRating(false);
        if (onFeedback) onFeedback({ rating, helpful, comment });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Thanks for your feedback!</span>
        {rating > 0 && (
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon 
                key={star} 
                filled={star <= rating} 
                className={star <= rating ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-2">
      {!showRating ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setHelpful(true);
              setRating(5);
              submitFeedback();
            }}
            className="p-1.5 text-gray-400 hover:text-green-600 transition-colors"
            title="Helpful"
          >
            <ThumbsUpIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setHelpful(false);
              setShowRating(true);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            title="Not helpful"
          >
            <ThumbsDownIcon className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500">Was this helpful?</span>
        </div>
      ) : (
        <div className="p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Help us improve - what went wrong?
          </p>
          
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <StarIcon 
                  filled={star <= (hoveredStar || rating)} 
                  className={star <= (hoveredStar || rating) ? "text-yellow-500" : "text-gray-300 dark:text-gray-600"}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What could be better? (optional)"
            className="w-full p-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-900 text-gray-900 dark:text-gray-100 resize-none"
            rows={2}
          />

          <div className="flex gap-2 mt-2">
            <button
              onClick={submitFeedback}
              disabled={rating === 0}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
            <button
              onClick={() => {
                setShowRating(false);
                setRating(0);
                setComment('');
              }}
              className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageFeedback;