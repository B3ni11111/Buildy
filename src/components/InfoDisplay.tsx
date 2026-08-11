import '../styles/InfoDisplay.css';

interface InfoDisplayProps {
  data: {
    name: string;
    type: 'A' | 'B';
  };
  onReset: () => void;
}

function InfoDisplay({ data, onReset }: InfoDisplayProps) {
  return (
    <div className="info-container">
      <h1>User Information</h1>
      <div className="info-card">
        <div className="info-item">
          <label>Name:</label>
          <p>{data.name}</p>
        </div>
        <div className="info-item">
          <label>Type:</label>
          <p>{data.type}</p>
        </div>
      </div>
      <button onClick={onReset} className="reset-btn">
        Go Back
      </button>
    </div>
  );
}

export default InfoDisplay;
