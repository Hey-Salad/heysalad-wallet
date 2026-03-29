# Mercuryo On-Ramp Setup Guide

## What Was Implemented

The HeySalad Wallet now has a full Mercuryo integration that allows users to buy crypto (TRX) with fiat currency using credit cards, debit cards, or bank transfers.

### Files Created/Modified

1. **[components/MercuryoWidget.tsx](components/MercuryoWidget.tsx)** - New WebView-based on-ramp modal
2. **[components/SmartCryptoIcon.tsx](components/SmartCryptoIcon.tsx)** - New smart crypto icon component with multiple fallbacks
3. **[services/CryptoIconService.ts](services/CryptoIconService.ts)** - Icon fetching service with caching
4. **[app/(tabs)/(wallet)/index.tsx](app/(tabs)/(wallet)/index.tsx)** - Added "Buy" button and integrated Mercuryo widget

### Key Features

**Mercuryo Integration:**
- Full-screen modal with WebView
- Pre-configured for TRX on TRON network
- User's wallet address automatically populated
- Success/cancel detection
- Beautiful branded UI matching HeySalad design

**Smart Crypto Icons:**
- Bundled icons for 15+ major cryptocurrencies (offline support)
- CoinGecko API integration for comprehensive coverage
- 7-day AsyncStorage caching to reduce API calls
- Trust Wallet CDN fallback
- Special TRON logo rendering

## Setup Required

### 1. Sign Up for Mercuryo

1. Go to [https://mercuryo.io](https://mercuryo.io)
2. Click "Get Started" or "Contact Sales"
3. Fill out the partnership application form:
   - Company: HeySalad OÜ
   - Registration: 17327633
   - Address: Pärnu mnt 139b, 11317 Tallinn, Estonia
   - Email: peter@heysalad.io
   - Use case: Crypto on-ramp for mobile wallet app

4. Explain your use case:
   > "We're building a mobile crypto wallet app (HeySalad Wallet) and want to allow users to buy cryptocurrency directly within our app using fiat currency. We need a reliable on-ramp solution that supports TRON (TRX) and provides a good user experience."

### 2. Get Your Widget ID

After approval, Mercuryo will provide you with:
- **Widget ID** - Unique identifier for your app
- **API credentials** (optional, for advanced features)
- **Webhook URLs** (optional, for transaction notifications)

### 3. Configure the Widget

Edit [components/MercuryoWidget.tsx:53](components/MercuryoWidget.tsx#L53):

```typescript
// Replace 'YOUR_WIDGET_ID' with your actual Mercuryo widget ID
const widgetId = 'YOUR_WIDGET_ID';
```

### 4. Test the Integration

**Test Mode:**
Mercuryo provides a test environment for development:
- Test widget URL: `https://sandbox-exchange.mercuryo.io`
- You can use test cards to simulate purchases
- No real money is charged in test mode

To enable test mode, modify [components/MercuryoWidget.tsx:61](components/MercuryoWidget.tsx#L61):

```typescript
// For testing
return `https://sandbox-exchange.mercuryo.io/?${params.toString()}`;

// For production
return `https://exchange.mercuryo.io/?${params.toString()}`;
```

**Test Cards:**
Mercuryo will provide test card numbers in their documentation.

### 5. Configure Deep Linking (Optional)

For better UX, configure deep links to detect successful purchases:

1. Update [app.json:3-10](app.json#L3-L10) to include Mercuryo return URL:
```json
{
  "expo": {
    "scheme": "heysalad",
    "ios": {
      "associatedDomains": ["applinks:heysalad.com"]
    }
  }
}
```

2. The widget already handles the `heysalad://mercuryo-success` URL

## Usage

Users can now:

1. **Open wallet home screen**
2. **Tap "Buy" button** (new button between balance and action row)
3. **Mercuryo widget opens** in full-screen modal
4. **Select amount and payment method**
5. **Complete KYC** (if first purchase)
6. **Pay with card or bank transfer**
7. **Crypto arrives in wallet** (usually 5-15 minutes)

## Security Considerations

**Built-in Security:**
- WebView is isolated from app code
- No sensitive data is stored
- All payments handled by Mercuryo (PCI compliant)
- Deep links verified before triggering success

**KYC/AML:**
Mercuryo handles all KYC/AML compliance:
- Identity verification
- Address verification
- Transaction monitoring
- Fraud prevention

**User Privacy:**
- Only wallet address is shared with Mercuryo
- No personal data sent from app
- Users enter payment info directly to Mercuryo

## CoinGecko API (Optional)

The SmartCryptoIcon component uses CoinGecko's free API for crypto icons. No API key is required for basic usage, but you may want to:

1. **Sign up at [CoinGecko](https://www.coingecko.com/en/api)** for higher rate limits
2. **Add API key** to [services/CryptoIconService.ts:72](services/CryptoIconService.ts#L72):

```typescript
const response = await fetch(
  `https://api.coingecko.com/api/v3/coins/${coinGeckoId}`,
  {
    headers: {
      'x-cg-pro-api-key': 'YOUR_API_KEY' // Add if you have Pro plan
    }
  }
);
```

**Free tier limits:**
- 10-50 calls/minute
- Sufficient for most use cases due to 7-day caching

## Testing Checklist

- [ ] Replace `YOUR_WIDGET_ID` in MercuryoWidget.tsx
- [ ] Test Buy button opens Mercuryo modal
- [ ] Test modal displays correctly on iOS/Android
- [ ] Test successful purchase flow (test mode)
- [ ] Test cancel/close handling
- [ ] Test crypto icons load correctly
- [ ] Test icon caching works
- [ ] Test TRON logo displays properly
- [ ] Verify wallet address is pre-filled
- [ ] Test deep link success detection

## Cost Structure

Mercuryo typically charges:
- **1.95% - 3.95%** per transaction (varies by payment method)
- **No monthly fees** for basic integration
- **No setup fees** for startups

You can negotiate rates based on volume.

## Next Steps

1. **Sign up for Mercuryo** - Start the application process
2. **Get Widget ID** - Wait for approval and credentials
3. **Configure widget** - Add your Widget ID to MercuryoWidget.tsx
4. **Test integration** - Use test mode to verify everything works
5. **Go live** - Switch to production URL
6. **Monitor transactions** - Check Mercuryo dashboard for analytics

## Support

- **Mercuryo Support**: support@mercuryo.io
- **Mercuryo Docs**: https://docs.mercuryo.io
- **CoinGecko Docs**: https://www.coingecko.com/en/api/documentation

## Alternative Providers

If Mercuryo doesn't work out, consider:

1. **Transak** - Better SDK, excellent docs
   - Similar pricing
   - More crypto/fiat pairs
   - Better for global coverage

2. **Ramp Network** - Lower fees
   - 0.49% - 2.9% fees
   - Good European coverage
   - Clean UI

3. **MoonPay** - Most popular
   - Highest fees (4.5%)
   - Best brand recognition
   - Most payment methods

All three have similar integration patterns to Mercuryo.
