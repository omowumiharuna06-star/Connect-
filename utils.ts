// Generates a unique ID
export const uid = (prefix: string = 'id'): string => {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
};

// Creates a consistent, sorted key for a chat between two users
export const getChatKey = (userId1: string, userId2: string): string => {
    const ids = [userId1, userId2].sort();
    return `connectplus_chat_${ids[0]}_${ids[1]}`;
}

// Converts a file to a Base64 encoded string
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

/**
 * Calculates a score for a post based on likes, comments, and recency.
 * This helps identify "trending" or important posts.
 */
export const calculatePostScore = (post: { likedBy: string[], comments: any[], timestamp: number }): number => {
  const likesWeight = 1;
  const commentsWeight = 2;
  const hoursSincePost = (Date.now() - post.timestamp) / (1000 * 3600);

  // The "gravity" factor penalizes older posts. A higher number means age matters less.
  const gravity = 1.8; 
  
  const score = (post.likedBy.length * likesWeight) + (post.comments.length * commentsWeight);
  
  // Using a common formula for decay: Score / (Time + 2)^Gravity
  return score / Math.pow(hoursSincePost + 2, gravity);
};