import React, { useState, useEffect } from 'react';
import './App.css';
import io from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid} from 'recharts';

const socket = io('http://localhost:3001');

function App() {
  const [multiplierData, setMultiplierData] = useState([]);
  const [multiplier, setMultiplier] = useState(1.00);
  const [userBalance, setUserBalance] = useState(1000);
  const [betAmount, setBetAmount] = useState('');
  const [isCrashing, setIsCrashing] = useState(false);
  const [betPlaced, setBetPlaced] = useState(false);
  const [countdown, setCountdown] = useState(null);


  useEffect(() => {
    socket.on('multiplier', (newMultiplier) => {
      setMultiplier(newMultiplier);
      setMultiplierData(prevData => [...prevData, { time: new Date().getTime(), multiplier: newMultiplier }]);
    });
  
    socket.on('crash', (newCrashMultiplier) => {
      setIsCrashing(true);
      setTimeout(() => {
        setIsCrashing(true);
        setCountdown(null);
        setMultiplier(1.00);
        setMultiplierData([]); // Reset the graph data
      }, 5000); // Delay of 5 seconds
    });

    socket.on('countdown', (count) => {
      console.log('Countdown received:', count);
      setCountdown(count);
      if (count === null) {
        setIsCrashing(false);
        setMultiplier(1.00);
        setMultiplierData([]); // Reset the graph data
      }
    });
  
    // Cleanup
    return () => {
      setMultiplierData([]); // Reset the graph data on unmount
      socket.disconnect();
    };
  }, []);

  const handleBetAmountChange = (e) => {
    setBetAmount(e.target.value);
  };

  const handlePlaceBet = () => {
    if (betPlaced) {
      // Handle cash-out
      fetch('/cash-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ betAmount: parseFloat(betAmount), multiplier: multiplier }),
      })
        .then((response) => response.json())
        .then((data) => {
          setUserBalance(data.userBalance);
          setBetAmount('');
          setBetPlaced(false);
        })
        .catch((error) => {
          console.error('Error cashing out:', error);
        });
    } else {
      // Handle place bet
      const betAmountFloat = parseFloat(betAmount);
      if (betAmountFloat > 0 && betAmountFloat <= userBalance) {
        setUserBalance(prevBalance => prevBalance - betAmountFloat);
        setBetPlaced(true);
      } else {
        alert('Invalid bet amount!');
      }
    }
  };

  return (
    <div className="container">
      <h1>Welcome to Crash Gambling!</h1>
      {countdown !== null ? (
        <p>Next round in: {countdown} seconds</p>
      ) : (
        <div className="game-container">
          <div className="line-chart-container">
            <LineChart
              width={700}
              height={300}
              data={multiplierData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis dataKey="time" tickFormatter={(time) => new Date(time).toLocaleTimeString()} />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Line type="monotone" dataKey="multiplier" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </div>
          {isCrashing ? (
            <p>Crashed! Multiplier: <span className={`multiplier ${isCrashing ? 'crash' : ''}`}>{multiplier.toFixed(2)}x</span></p>
          ) : (
            <p>Current Multiplier: <span className="multiplier">{multiplier.toFixed(2)}x</span></p>
          )}
          <p>Your Balance: £<span className="user-balance">{userBalance.toFixed(2)}</span></p>
          <input
            type="number"
            className="bet-input"
            value={betAmount}
            onChange={handleBetAmountChange}
            placeholder="Enter bet amount"
            disabled={isCrashing}
          />
          <button className="place-bet-btn" onClick={handlePlaceBet} disabled={isCrashing}>
            {betPlaced ? 'Cash Out' : 'Place Bet'}
          </button>
        </div>
      )}
    </div>
  );
  
  
        }
export default App;
