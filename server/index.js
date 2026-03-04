require('dotenv').config();

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const express = require('express');
const cors = require('cors');

// Use legacy-style client/env which works with the current SDK
const { Client, Environment } = require('square/legacy');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Square client for Sandbox
const client = new Client({
  bearerAuthCredentials: {
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
  },
  environment: Environment.Sandbox,
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/pay', async (req, res) => {
  const { token, amount, name } = req.body;

  if (!token || !amount) {
    return res.status(400).json({ error: 'Missing token or amount' });
  }

  try {
    const paymentsApi = client.paymentsApi;

    const body = {
      sourceId: token,
      idempotencyKey: `${Date.now()}-${Math.random()}`,
      amountMoney: {
        amount: Math.round(Number(amount) * 100), // dollars → cents
        currency: 'USD',
      },
      locationId: process.env.SQUARE_LOCATION_ID,
      note: `Test payment for ${name || 'Guest'}`,
    };

    const { result } = await paymentsApi.createPayment(body);

	res.json({
	  success: true,
	  payment: {
		id: result.payment.id,
		status: result.payment.status,
		amount: result.payment.amountMoney.amount,
		currency: result.payment.amountMoney.currency, 
	  },
	});
	
  } catch (error) {
    console.error(error);
    const message =
      error?.result?.errors?.[0]?.detail || 'Payment failed. See server logs.';
    res.status(500).json({ success: false, error: message });
  }
});

const port = process.env.PORT || 5001;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});