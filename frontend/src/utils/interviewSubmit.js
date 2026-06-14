/**
 * Submit interview video with non-verbal communication analytics
 * @param {Blob} videoBlob - The recorded video blob
 * @param {string} userId - The user ID
 * @param {Array<string>} goals - Interview goals
 * @param {Object} analytics - Non-verbal communication scores
 * @param {number} analytics.spatialDistribution - Score 0-100
 * @param {number} analytics.handGestures - Score 0-100
 * @param {number} analytics.eyeContact - Score 0-100
 * @param {number} analytics.posture - Score 0-100
 * @returns {Promise<Object>} Response from the backend
 */
export async function submitInterviewWithAnalytics(videoBlob, userId, goals = [], analytics = null) {
  const formData = new FormData();
  formData.append('video', videoBlob, 'interview.webm');
  formData.append('userId', userId);
  formData.append('goals', JSON.stringify(goals));
  
  if (analytics) {
    formData.append('analytics', JSON.stringify({
      spatialDistribution: Math.round(analytics.spatialDistribution),
      handGestures: Math.round(analytics.handGestures),
      eyeContact: Math.round(analytics.eyeContact),
      posture: Math.round(analytics.posture)
    }));
  }

  const response = await fetch('/api/interview/submit', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Failed to submit interview: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Submit batch of interview videos with non-verbal analytics
 * @param {Array<Blob>} videoBlobs - Array of recorded video blobs
 * @param {string} userId - The user ID
 * @param {Array<string>} questions - Interview questions
 * @param {Array<string>} goals - Interview goals
 * @param {string} difficulty - Interview difficulty level
 * @param {Object} analytics - Non-verbal communication scores (same for all videos in session)
 * @returns {Promise<Object>} Response from the backend
 */
export async function submitBatchWithAnalytics(
  videoBlobs,
  userId,
  questions = [],
  goals = [],
  difficulty = 'Medium',
  analytics = null
) {
  const formData = new FormData();
  
  videoBlobs.forEach((blob, index) => {
    formData.append(`video_${index}`, blob, `interview-q${index}.webm`);
  });
  
  formData.append('userId', userId);
  formData.append('questions', JSON.stringify(questions));
  formData.append('goals', JSON.stringify(goals));
  formData.append('difficulty', difficulty);
  
  if (analytics) {
    formData.append('analytics', JSON.stringify({
      spatialDistribution: Math.round(analytics.spatialDistribution),
      handGestures: Math.round(analytics.handGestures),
      eyeContact: Math.round(analytics.eyeContact),
      posture: Math.round(analytics.posture)
    }));
  }

  const response = await fetch('/api/interview/submit-batch', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`Failed to submit batch interview: ${response.statusText}`);
  }

  return await response.json();
}
