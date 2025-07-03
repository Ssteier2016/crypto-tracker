const { useState, useEffect } = React;
const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = window.Recharts || {};

if (!React || !ReactDOM || !LineChart) {
    console.error('Alguna biblioteca no se cargó correctamente:', { React, ReactDOM, LineChart });
    throw new Error('Faltan dependencias esenciales (Recharts no se cargó)');
}

const lucide = window.lucide || {};
const renderIcon = (iconName, props = {}) => {
    const IconComponent = lucide[iconName] || (() => null);
    return React.createElement(IconComponent, { ...props });
};

const CryptoTracker = () => {
    const [selectedCrypto, setSelectedCrypto] = useState('BTC');
    const [currency, setCurrency] = useState('USD');
    const [currentView, setCurrentView] = useState('tracker');
    const [transactions, setTransactions] = useState([]);
    const [newTransaction, setNewTransaction] = useState({
        type: 'compra',
        crypto: 'BTC',
        amount: '',
        price: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [cryptoDetails, setCryptoDetails] = useState({
        BTC: { name: 'Bitcoin', symbol: '₿', price: 0, change: 0 },
        ETH: { name: 'Ethereum', symbol: '◊', price: 0, change: 0 },
        BNB: { name: 'BNB', symbol: '⬢', price: 0, change: 0 },
        SOL: { name: 'Solana', symbol: 'S', price: 0, change: 0 }
    });
    const [loading, setLoading] = useState(false);
    const [chartData, setChartData] = useState([]);

    const exchangeRates = {
        USD: 1,
        EUR: 0.85,
        ARS: 350,
        MXN: 18.5,
        COP: 4200,
        BRL: 5.2
    };

    const fetchCryptoPrices = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin,solana&vs_currencies=usd&include_24hr_change=true'
            );
            const data = await response.json();
            setCryptoDetails(prevDetails => ({
                ...prevDetails,
                BTC: { ...prevDetails.BTC, price: data.bitcoin?.usd || 0, change: data.bitcoin?.usd_24h_change || 0 },
                ETH: { ...prevDetails.ETH, price: data.ethereum?.usd || 0, change: data.ethereum?.usd_24h_change || 0 },
                BNB: { ...prevDetails.BNB, price: data.binancecoin?.usd || 0, change: data.binancecoin?.usd_24h_change || 0 },
                SOL: { ...prevDetails.SOL, price: data.solana?.usd || 0, change: data.solana?.usd_24h_change || 0 }
            }));
        } catch (error) {
            console.error('Error fetching crypto prices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCryptoPrices();
        const interval = setInterval(fetchCryptoPrices, 60000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setNewTransaction(prev => ({
            ...prev,
            price: cryptoDetails[selectedCrypto]?.price.toString() || ''
        }));
    }, [selectedCrypto, cryptoDetails]);

    useEffect(() => {
        const calculateCumulativeProfitData = () => {
            const dailyProfits = {};
            transactions.forEach(t => {
                const date = t.date;
                let transactionProfit = 0;
                if (t.type === 'venta') {
                    transactionProfit = t.total;
                } else if (t.type === 'compra' || t.type === 'comision_compra' || t.type === 'comision_venta') {
                    transactionProfit = -t.total;
                }
                dailyProfits[date] = (dailyProfits[date] || 0) + transactionProfit;
            });

            const sortedDates = Object.keys(dailyProfits).sort();
            const newChartData = [];
            let currentCumulativeProfit = 0;

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (sortedDates.length > 0) {
                const firstTransactionDate = new Date(sortedDates[0]);
                firstTransactionDate.setHours(0, 0, 0, 0);
                const dayBeforeFirst = new Date(firstTransactionDate);
                dayBeforeFirst.setDate(dayBeforeFirst.getDate() - 1);
                newChartData.push({ fecha: dayBeforeFirst.toISOString().split('T')[0], profit: 0 });

                let currentDate = new Date(firstTransactionDate);
                while (currentDate <= today) {
                    const dateString = currentDate.toISOString().split('T')[0];
                    if (dailyProfits[dateString]) {
                        currentCumulativeProfit += dailyProfits[dateString];
                    }
                    newChartData.push({ fecha: dateString, profit: currentCumulativeProfit });
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            } else {
                newChartData.push({ fecha: today.toISOString().split('T')[0], profit: 0 });
            }

            setChartData(newChartData);
        };

        calculateCumulativeProfitData();
    }, [transactions]);

    const calculateTotalBalance = () => {
        const cryptoBalances = { BTC: 0, ETH: 0, BNB: 0, SOL: 0 };
        transactions.forEach(transaction => {
            if (transaction.type === 'compra') {
                cryptoBalances[transaction.crypto] += parseFloat(transaction.amount);
            } else if (transaction.type === 'venta') {
                cryptoBalances[transaction.crypto] -= parseFloat(transaction.amount);
            }
        });
        const totalUSD = Object.entries(cryptoBalances).reduce((total, [crypto, amount]) => {
            return total + (amount * cryptoDetails[crypto].price);
        }, 0);
        return {
            usd: totalUSD,
            ars: totalUSD * exchangeRates.ARS,
            btc: cryptoDetails.BTC.price > 0 ? totalUSD / cryptoDetails.BTC.price : 0,
            cryptoBalances
        };
    };

    const formatCurrency = (amount, curr = currency) => {
        const convertedAmount = amount * exchangeRates[curr];
        const symbols = { USD: '$', EUR: '€', ARS: '$', MXN: '$', COP: '$', BRL: 'R$' };
        return `${symbols[curr]}${convertedAmount.toLocaleString('es-ES', { maximumFractionDigits: 2 })}`;
    };

    const addTransaction = () => {
        if (newTransaction.amount && newTransaction.price) {
            const transaction = {
                ...newTransaction,
                id: Date.now(),
                total: parseFloat(newTransaction.amount) * parseFloat(newTransaction.price),
                timestamp: new Date().toISOString()
            };
            setTransactions([transaction, ...transactions]);
            setNewTransaction({
                type: 'compra',
                crypto: 'BTC',
                amount: '',
                price: cryptoDetails[selectedCrypto]?.price.toString() || '',
                date: new Date().toISOString().split('T')[0]
            });
        }
    };

    const calculateTotalProfit = () => {
        return transactions.reduce((total, t) => {
            if (t.type === 'venta') {
                return total + t.total;
            } else if (t.type === 'compra' || t.type === 'comision_compra' || t.type === 'comision_venta') {
                return total - t.total;
            }
            return total;
        }, 0);
    };

    const getTodayProfit = () => {
        const today = new Date().toISOString().split('T')[0];
        return transactions
            .filter(t => t.date === today)
            .reduce((total, t) => {
                if (t.type === 'venta') {
                    return total + t.total;
                } else if (t.type === 'compra' || t.type === 'comision_compra' || t.type === 'comision_venta') {
                    return total - t.total;
                }
                return total;
            }, 0);
    };

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(CryptoTracker));
