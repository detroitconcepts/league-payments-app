import React, { useState } from 'react';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';

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

  const handlePayment = async (tokenResult) => {
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
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Test Square Payment (Sandbox)</h2>

      <div style={{ marginBottom: 12 }}>
        <label>
          Name:<br />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            placeholder="Bowler name"
          />
        </label>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label>
          Amount (USD):<br />
          <input
            type="number"
            min="1"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', padding: 8 }}
            placeholder="e.g. 10.00"
          />
        </label>
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
		  amount: amount || '1.00',
		  label: 'Test Payment',
		},
	  })}
	>
	  <CreditCard />
	</PaymentForm>

      <button
        onClick={() => {
          const button = document.querySelector(
            '.sq-credit-card .sq-payment-button'
          );
          if (button) button.click();
        }}
        disabled={!amount || loading}
        style={{ marginTop: 16, padding: '8px 16px' }}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>

      {error && (
        <div style={{ marginTop: 16, color: 'red' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: 16, padding: 10, border: '1px solid #ccc' }}>
        <h4>Payment Result</h4>
          <div>Payment ID: {result.id}</div>
          <div>Status: {result.status}</div>
          <div>
            Amount: {result.amount / 100} {result.currency}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
