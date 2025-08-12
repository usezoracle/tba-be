# Watchlist Module - Frontend Integration Guide

## Overview
The Watchlist module allows users to manage their token watchlists. Users can add multiple tokens, remove them, and view their current watchlist with pagination.

## API Endpoints

### 1. Add Tokens to Watchlist
**POST** `/api/v1/watchlist/add`

**Request Body:**
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "tokenAddresses": [
    "0xabc1234567890123456789012345678901234567",
    "0xdef4567890123456789012345678901234567890"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully added 2 tokens to watchlist",
  "addedCount": 2
}
```

### 2. Remove Tokens from Watchlist
**DELETE** `/api/v1/watchlist/remove`

**Request Body:**
```json
{
  "walletAddress": "0x1234567890123456789012345678901234567890",
  "tokenAddresses": [
    "0xabc1234567890123456789012345678901234567"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully removed 1 token from watchlist",
  "removedCount": 1
}
```

### 3. Get User Watchlist
**GET** `/api/v1/watchlist/get?walletAddress=0x1234...&page=1&limit=20`

**Query Parameters:**
- `walletAddress` (required): User's wallet address
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "userId": "user123",
      "tokenAddress": "0xabc1234567890123456789012345678901234567",
      "addedAt": "2024-01-01T00:00:00.000Z",
      "user": {
        "id": "user123",
        "walletAddress": "0x1234567890123456789012345678901234567890"
      }
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### 4. Check if Token is in Watchlist
**GET** `/api/v1/watchlist/check/{walletAddress}/{tokenAddress}`

**Response:**
```json
{
  "success": true,
  "isInWatchlist": true,
  "message": "Token is in watchlist"
}
```

### 5. Get Watchlist Count
**GET** `/api/v1/watchlist/count/{walletAddress}`

**Response:**
```json
{
  "success": true,
  "count": 5,
  "message": "User has 5 tokens in watchlist"
}
```

## Frontend Implementation Examples

### React Hook for Watchlist Management
```typescript
import { useState, useEffect } from 'react';

interface WatchlistItem {
  id: string;
  tokenAddress: string;
  addedAt: string;
}

interface UseWatchlistProps {
  walletAddress: string;
}

export const useWatchlist = ({ walletAddress }: UseWatchlistProps) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToWatchlist = async (tokenAddresses: string[]) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/watchlist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, tokenAddresses }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Refresh watchlist
        fetchWatchlist();
        return result;
      }
    } catch (err) {
      setError('Failed to add tokens to watchlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWatchlist = async (tokenAddresses: string[]) => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/watchlist/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress, tokenAddresses }),
      });
      
      const result = await response.json();
      if (result.success) {
        // Refresh watchlist
        fetchWatchlist();
        return result;
      }
    } catch (err) {
      setError('Failed to remove tokens from watchlist');
    } finally {
      setLoading(false);
    }
  };

  const fetchWatchlist = async (page = 1, limit = 20) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/watchlist/get?walletAddress=${walletAddress}&page=${page}&limit=${limit}`
      );
      
      const result = await response.json();
      if (result.success) {
        setWatchlist(result.data);
      }
    } catch (err) {
      setError('Failed to fetch watchlist');
    } finally {
      setLoading(false);
    }
  };

  const isTokenInWatchlist = async (tokenAddress: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/v1/watchlist/check/${walletAddress}/${tokenAddress}`
      );
      
      const result = await response.json();
      return result.success && result.isInWatchlist;
    } catch (err) {
      return false;
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchWatchlist();
    }
  }, [walletAddress]);

  return {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
    fetchWatchlist,
    isTokenInWatchlist,
  };
};
```

### React Component Example
```typescript
import React from 'react';
import { useWatchlist } from './hooks/useWatchlist';

interface WatchlistProps {
  walletAddress: string;
}

export const Watchlist: React.FC<WatchlistProps> = ({ walletAddress }) => {
  const {
    watchlist,
    loading,
    error,
    addToWatchlist,
    removeFromWatchlist,
  } = useWatchlist({ walletAddress });

  const handleAddToken = async (tokenAddress: string) => {
    await addToWatchlist([tokenAddress]);
  };

  const handleRemoveToken = async (tokenAddress: string) => {
    await removeFromWatchlist([tokenAddress]);
  };

  if (loading) return <div>Loading watchlist...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="watchlist">
      <h2>My Watchlist ({watchlist.length})</h2>
      
      {watchlist.length === 0 ? (
        <p>No tokens in your watchlist yet.</p>
      ) : (
        <div className="watchlist-items">
          {watchlist.map((item) => (
            <div key={item.id} className="watchlist-item">
              <span className="token-address">{item.tokenAddress}</span>
              <span className="added-date">
                Added: {new Date(item.addedAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleRemoveToken(item.tokenAddress)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Token Card with Watchlist Integration
```typescript
import React, { useState, useEffect } from 'react';

interface TokenCardProps {
  tokenAddress: string;
  walletAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  tokenAddress,
  walletAddress,
  tokenName,
  tokenSymbol,
}) => {
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkWatchlistStatus = async () => {
    try {
      const response = await fetch(
        `/api/v1/watchlist/check/${walletAddress}/${tokenAddress}`
      );
      const result = await response.json();
      setIsInWatchlist(result.success && result.isInWatchlist);
    } catch (err) {
      console.error('Failed to check watchlist status');
    }
  };

  const toggleWatchlist = async () => {
    try {
      setLoading(true);
      if (isInWatchlist) {
        await fetch('/api/v1/watchlist/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            tokenAddresses: [tokenAddress],
          }),
        });
        setIsInWatchlist(false);
      } else {
        await fetch('/api/v1/watchlist/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            tokenAddresses: [tokenAddress],
          }),
        });
        setIsInWatchlist(true);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress && tokenAddress) {
      checkWatchlistStatus();
    }
  }, [walletAddress, tokenAddress]);

  return (
    <div className="token-card">
      <div className="token-info">
        <h3>{tokenName || 'Unknown Token'}</h3>
        <p>{tokenSymbol || 'N/A'}</p>
        <p className="token-address">{tokenAddress}</p>
      </div>
      
      <button
        onClick={toggleWatchlist}
        disabled={loading}
        className={`watchlist-btn ${isInWatchlist ? 'in-watchlist' : ''}`}
      >
        {loading ? 'Loading...' : isInWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
      </button>
    </div>
  );
};
```

## Error Handling

The API returns consistent error responses:
```json
{
  "success": false,
  "message": "Error description",
  "statusCode": 400
}
```

Common error scenarios:
- Invalid wallet address format
- Invalid token address format
- User not found
- Database connection issues
- Validation errors (e.g., too many tokens in one request)

## Performance Considerations

1. **Batch Operations**: Use the batch endpoints to add/remove multiple tokens at once
2. **Pagination**: Implement pagination for large watchlists
3. **Caching**: Consider caching watchlist status for frequently accessed tokens
4. **Real-time Updates**: Use WebSocket or Server-Sent Events for real-time watchlist updates

## Security Notes

- All wallet addresses are validated using Ethereum address format
- Token addresses are validated before processing
- User authentication should be implemented in production
- Rate limiting is applied to prevent abuse

