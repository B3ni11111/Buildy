import { useState } from 'react';
import '../styles/Form.css';

interface FormProps {
  onSubmit: (data: { name: string; type: 'A' | 'B' }) => void;
}

function Form({ onSubmit }: FormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'A' | 'B'>('A');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    onSubmit({ name: name.trim(), type });
    setName('');
    setType('A');
    setError('');
  };

  return (
    <div className="form-container">
      <h1>Welcome</h1>
      <form onSubmit={handleSubmit} className="form">
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Enter your name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type:</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as 'A' | 'B')}
          >
            <option value="A">Type A</option>
            <option value="B">Type B</option>
          </select>
        </div>

        {error && <p className="error">{error}</p>}

        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
}

export default Form;
