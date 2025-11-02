/**
 * Basecamp Chat Parser
 *
 * Parses the Troubleshooting Chat export from Basecamp and extracts
 * Q&A pairs for knowledge base ingestion.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse the Basecamp chat export
 */
function parseBasecampChat(filePath) {
  console.log('Reading Basecamp chat file...');
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  console.log(`Total lines: ${lines.length}`);

  const conversations = [];
  let currentAuthor = null;
  let currentTimestamp = null;
  let currentMessage = [];
  let messageCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and UI elements
    if (!line ||
        line.startsWith('Show') ||
        line.startsWith('quick nav') ||
        line.includes('boosted the chat') ||
        line === 'New boost' ||
        line.includes('Zoom') ||
        line.includes('View full-size') ||
        line.includes('Download') ||
        line.includes('Jump Menu')) {
      continue;
    }

    // Check if this is a timestamp (format: "5:37pm", "8:22pm", etc.)
    if (/^\d{1,2}:\d{2}(am|pm)$/i.test(line)) {
      // Save previous message if exists
      if (currentAuthor && currentMessage.length > 0) {
        const messageText = currentMessage.join(' ').trim();
        if (messageText && messageText.length > 10) {
          conversations.push({
            author: currentAuthor,
            timestamp: currentTimestamp,
            message: messageText
          });
          messageCount++;
        }
      }

      currentTimestamp = line;
      currentMessage = [];
      continue;
    }

    // Check if this is an author name (appears twice in a row)
    if (i + 1 < lines.length && line === lines[i + 1].trim() && line.length > 0) {
      currentAuthor = line;
      i++; // Skip the duplicate line
      continue;
    }

    // Accumulate message content
    if (currentAuthor && currentTimestamp) {
      currentMessage.push(line);
    }
  }

  // Save last message
  if (currentAuthor && currentMessage.length > 0) {
    const messageText = currentMessage.join(' ').trim();
    if (messageText && messageText.length > 10) {
      conversations.push({
        author: currentAuthor,
        timestamp: currentTimestamp,
        message: messageText
      });
      messageCount++;
    }
  }

  console.log(`Extracted ${messageCount} messages`);
  return conversations;
}

/**
 * Extract Q&A pairs from conversations
 */
function extractQAPairs(conversations) {
  const qaPairs = [];

  for (let i = 0; i < conversations.length - 1; i++) {
    const current = conversations[i];
    const next = conversations[i + 1];

    // Look for questions (contains ?, mentions equipment, or asks for help)
    const isQuestion =
      current.message.includes('?') ||
      /\b(how|why|what|where|when|can|does|is|are|help|issue|problem|error|not working|broken)\b/i.test(current.message);

    // Equipment-related keywords
    const hasEquipment =
      /\b(bed|booth|versa|norvell|spray|tan|lamp|bulb|led|beauty angel|affinity|prestige|mystic|hydration)\b/i.test(current.message);

    if (isQuestion && hasEquipment && current.message.length > 20) {
      // Next message from different author is likely the answer
      if (next.author !== current.author && next.message.length > 20) {
        qaPairs.push({
          question: current.message,
          question_author: current.author,
          question_timestamp: current.timestamp,
          answer: next.message,
          answer_author: next.author,
          answer_timestamp: next.timestamp
        });
      }
    }
  }

  console.log(`Extracted ${qaPairs.length} Q&A pairs`);
  return qaPairs;
}

/**
 * Main function
 */
function main() {
  console.log('=== Basecamp Chat Parser ===\n');

  const inputPath = join(__dirname, '..', 'Troubleshooting Chat', 'trouble shoot.txt');
  const outputPath = join(__dirname, '..', 'Troubleshooting Chat', 'basecamp-qa-pairs.json');

  // Parse conversations
  const conversations = parseBasecampChat(inputPath);

  // Extract Q&A pairs
  const qaPairs = extractQAPairs(conversations);

  // Save to JSON
  writeFileSync(outputPath, JSON.stringify(qaPairs, null, 2));
  console.log(`\nSaved ${qaPairs.length} Q&A pairs to: ${outputPath}`);

  // Show sample
  if (qaPairs.length > 0) {
    console.log('\n=== Sample Q&A Pair ===');
    console.log('Question:', qaPairs[0].question);
    console.log('Answer:', qaPairs[0].answer);
  }

  // Statistics
  const authors = new Set();
  qaPairs.forEach(pair => {
    authors.add(pair.question_author);
    authors.add(pair.answer_author);
  });

  console.log('\n=== Statistics ===');
  console.log(`Total conversations: ${conversations.length}`);
  console.log(`Q&A pairs extracted: ${qaPairs.length}`);
  console.log(`Unique participants: ${authors.size}`);
  console.log(`Average question length: ${Math.round(qaPairs.reduce((sum, p) => sum + p.question.length, 0) / qaPairs.length)} characters`);
  console.log(`Average answer length: ${Math.round(qaPairs.reduce((sum, p) => sum + p.answer.length, 0) / qaPairs.length)} characters`);
}

main();
