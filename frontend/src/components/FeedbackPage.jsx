import React from 'react';

const FeedbackPage = ({ scores, sessionDuration }) => {
  const calculateOverallScore = () => {
    const weights = {
      spatialDistribution: 0.2,
      handGestures: 0.3,
      eyeContact: 0.3,
      posture: 0.2
    };

    return Math.round(
      scores.spatialDistribution * weights.spatialDistribution +
      scores.handGestures * weights.handGestures +
      scores.eyeContact * weights.eyeContact +
      scores.posture * weights.posture
    );
  };

  const getGrade = (score) => {
    if (score >= 90) return { grade: 'A+', color: '#4caf50', message: 'Excellent!' };
    if (score >= 80) return { grade: 'A', color: '#4caf50', message: 'Great job!' };
    if (score >= 70) return { grade: 'B', color: '#8bc34a', message: 'Good work!' };
    if (score >= 60) return { grade: 'C', color: '#ff9800', message: 'Needs improvement' };
    if (score >= 50) return { grade: 'D', color: '#ff5722', message: 'Keep practicing' };
    return { grade: 'F', color: '#f44336', message: 'More practice needed' };
  };

  const getRecommendations = () => {
    const recommendations = [];
    
    if (scores.spatialDistribution < 70) {
      recommendations.push({
        metric: 'Spatial Distribution',
        icon: '📏',
        suggestion: 'Maintain a consistent distance from the camera. Position yourself so your face fills about 1/3 of the frame.',
        priority: 'high'
      });
    }
    
    if (scores.handGestures < 60) {
      recommendations.push({
        metric: 'Hand Gestures',
        icon: '👋',
        suggestion: 'Use your hands more to emphasize points. Natural hand movements make communication more engaging.',
        priority: 'medium'
      });
    } else if (scores.handGestures > 90) {
      recommendations.push({
        metric: 'Hand Gestures',
        icon: '👋',
        suggestion: 'Excellent use of hand gestures! Keep using them to emphasize key points.',
        priority: 'low'
      });
    }
    
    if (scores.eyeContact < 70) {
      recommendations.push({
        metric: 'Eye Contact',
        icon: '👁️',
        suggestion: 'Maintain more eye contact with the camera. This builds trust and shows confidence.',
        priority: 'high'
      });
    }
    
    if (scores.posture < 70) {
      recommendations.push({
        metric: 'Posture',
        icon: '🧍',
        suggestion: 'Sit up straight and keep your shoulders level. Good posture conveys professionalism and confidence.',
        priority: 'high'
      });
    }

    return recommendations;
  };

  const overallScore = calculateOverallScore();
  const gradeInfo = getGrade(overallScore);
  const recommendations = getRecommendations();

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '30px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>
          Non-Verbal Communication Feedback
        </h1>
        <p style={{ color: '#666', fontSize: '16px' }}>
          Session Duration: {Math.round(sessionDuration / 60)} minutes {sessionDuration % 60} seconds
        </p>
      </div>

      {/* Overall Score */}
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '40px',
        borderRadius: '12px',
        textAlign: 'center',
        marginBottom: '40px',
        border: `4px solid ${gradeInfo.color}`
      }}>
        <div style={{ fontSize: '18px', color: '#666', marginBottom: '10px' }}>
          Overall Performance
        </div>
        <div style={{
          fontSize: '72px',
          fontWeight: 'bold',
          color: gradeInfo.color,
          marginBottom: '10px'
        }}>
          {overallScore}/100
        </div>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: gradeInfo.color,
          marginBottom: '10px'
        }}>
          Grade: {gradeInfo.grade}
        </div>
        <div style={{ fontSize: '20px', color: '#666' }}>
          {gradeInfo.message}
        </div>
      </div>

      {/* Individual Metrics */}
      <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Detailed Metrics</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <MetricCard
          title="Spatial Distribution"
          icon="📏"
          score={scores.spatialDistribution}
          description="Face-to-camera distance consistency"
        />
        <MetricCard
          title="Hand Gestures"
          icon="👋"
          score={scores.handGestures}
          description="Natural hand movement frequency"
        />
        <MetricCard
          title="Eye Contact"
          icon="👁️"
          score={scores.eyeContact}
          description="Camera engagement percentage"
        />
        <MetricCard
          title="Posture"
          icon="🧍"
          score={scores.posture}
          description="Body alignment and positioning"
        />
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <>
          <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Recommendations</h2>
          <div style={{ marginBottom: '40px' }}>
            {recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        </>
      )}

      {/* Visual Progress Chart */}
      <h2 style={{ fontSize: '28px', marginBottom: '20px' }}>Performance Overview</h2>
      <div style={{
        backgroundColor: '#f5f5f5',
        padding: '30px',
        borderRadius: '12px'
      }}>
        <BarChart scores={scores} />
      </div>

      {/* Tips Section */}
      <div style={{
        marginTop: '40px',
        padding: '30px',
        backgroundColor: '#e3f2fd',
        borderRadius: '12px',
        borderLeft: '5px solid #2196f3'
      }}>
        <h3 style={{ fontSize: '24px', marginBottom: '15px', color: '#1976d2' }}>
          💡 Pro Tips for Better Non-Verbal Communication
        </h3>
        <ul style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }}>
          <li>Practice the "Rule of Thirds" - Position your eyes in the top third of the frame</li>
          <li>Use the "Triangle Technique" - Look at the camera lens, then briefly away, then back</li>
          <li>Keep hand gestures purposeful - Movement should emphasize, not distract</li>
          <li>Sit like a mountain - Imagine a string pulling you up from the crown of your head</li>
          <li>The 5-Second Rule - Hold eye contact for 4-5 seconds, then briefly look away</li>
        </ul>
      </div>
    </div>
  );
};

const MetricCard = ({ title, icon, score, description }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    if (score >= 50) return 'Needs Work';
    return 'Poor';
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '25px',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      border: `3px solid ${getScoreColor(score)}`
    }}>
      <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '10px' }}>
        {icon}
      </div>
      <h3 style={{ fontSize: '20px', textAlign: 'center', marginBottom: '10px' }}>
        {title}
      </h3>
      <div style={{
        fontSize: '48px',
        fontWeight: 'bold',
        textAlign: 'center',
        color: getScoreColor(score),
        marginBottom: '10px'
      }}>
        {Math.round(score)}/100
      </div>
      <div style={{
        textAlign: 'center',
        fontSize: '16px',
        fontWeight: 'bold',
        color: getScoreColor(score),
        marginBottom: '10px'
      }}>
        {getPerformanceLevel(score)}
      </div>
      <div style={{
        fontSize: '14px',
        color: '#666',
        textAlign: 'center',
        marginBottom: '15px'
      }}>
        {description}
      </div>
      <div style={{
        width: '100%',
        height: '12px',
        backgroundColor: '#e0e0e0',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${score}%`,
          height: '100%',
          backgroundColor: getScoreColor(score),
          transition: 'width 0.5s ease'
        }} />
      </div>
    </div>
  );
};

const RecommendationCard = ({ recommendation }) => {
  const getPriorityColor = (priority) => {
    if (priority === 'high') return '#f44336';
    if (priority === 'medium') return '#ff9800';
    return '#4caf50';
  };

  const getPriorityLabel = (priority) => {
    if (priority === 'high') return 'Priority: High';
    if (priority === 'medium') return 'Priority: Medium';
    return 'Great Job!';
  };

  return (
    <div style={{
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '15px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      borderLeft: `5px solid ${getPriorityColor(recommendation.priority)}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '32px', marginRight: '15px' }}>
          {recommendation.icon}
        </span>
        <div>
          <h4 style={{ fontSize: '18px', marginBottom: '5px' }}>
            {recommendation.metric}
          </h4>
          <span style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: getPriorityColor(recommendation.priority)
          }}>
            {getPriorityLabel(recommendation.priority)}
          </span>
        </div>
      </div>
      <p style={{ fontSize: '16px', color: '#555', lineHeight: '1.6', marginLeft: '47px' }}>
        {recommendation.suggestion}
      </p>
    </div>
  );
};

const BarChart = ({ scores }) => {
  const metrics = [
    { name: 'Spatial Distribution', score: scores.spatialDistribution, icon: '📏' },
    { name: 'Hand Gestures', score: scores.handGestures, icon: '👋' },
    { name: 'Eye Contact', score: scores.eyeContact, icon: '👁️' },
    { name: 'Posture', score: scores.posture, icon: '🧍' }
  ];

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <div>
      {metrics.map((metric, index) => (
        <div key={index} style={{ marginBottom: '25px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
              {metric.icon} {metric.name}
            </span>
            <span style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: getScoreColor(metric.score)
            }}>
              {Math.round(metric.score)}/100
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '30px',
            backgroundColor: '#e0e0e0',
            borderRadius: '15px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{
              width: `${metric.score}%`,
              height: '100%',
              backgroundColor: getScoreColor(metric.score),
              transition: 'width 0.8s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: '10px',
              color: '#fff',
              fontWeight: 'bold'
            }}>
              {metric.score > 15 && `${Math.round(metric.score)}%`}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedbackPage;
