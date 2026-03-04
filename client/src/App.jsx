import React, { useState } from 'react';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';
import PerfectGameLogo from './assets/PerfectGame_logo_web-final.jpg';

// Vite exposes env vars on import.meta.env with VITE_ prefix
const appId = import.meta.env.VITE_SQUARE_APP_ID;
const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

function App() {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const MIN_AMOUNT = 10;
  const MAX_AMOUNT = 930;
  
  const isAmountValid = () => {
    const value = Number(amount);
    return !isNaN(value) && value >= MIN_AMOUNT && value <= MAX_AMOUNT;
  };

  const handlePayment = async (tokenResult) => {
	if (!isAmountValid()) {
      setError(`Amount must be between $${MIN_AMOUNT} and $${MAX_AMOUNT}.`);
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch(`${backendUrl}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: tokenResult.token,
          amount,
          name,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Payment failed');
      }

      setResult(data.payment);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!appId || !locationId) {
    return <div>Missing Square env vars. Check .env file.</div>;
  }

  return (
    <div className="app-root">
      <div className="payment-card">
	    <img 
        src={PerfectGameLogo} 
        alt="Perfect Game Bowling" 
        className="logo"
        width="200"
        />
		
        <h2>League Payment (Sandbox)</h2>

        <div className="field">
          <label>
            Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bowler name"
            />
          </label>
        </div>

        <div className="field">
          <label>
            Amount (USD)
            <input
              type="number"
              min={MIN_AMOUNT}
              max={MAX_AMOUNT}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15.00"
            />
          </label>
          <small>
            Min ${MIN_AMOUNT}, Max ${MAX_AMOUNT}
          </small>
        </div>

        <PaymentForm
          applicationId={appId}
          locationId={locationId}
          cardTokenizeResponseReceived={async (token, buyer) => {
            await handlePayment(token);
          }}
          createPaymentRequest={() => ({
            countryCode: 'US',
            currencyCode: 'USD',
            total: {
              amount: isAmountValid() ? amount || '10.00' : '10.00',
              label: 'League Payment',
            },
          })}
        >
          <CreditCard />
        </PaymentForm>

        {loading && <div className="info">Processing payment…</div>}

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        {result && (
          <div className="result">
            <h4>Payment Result</h4>
            <div>Payment ID: {result.id}</div>
            <div>Status: {result.status}</div>
            <div>
              Amount: {result.amount / 100} {result.currency}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;