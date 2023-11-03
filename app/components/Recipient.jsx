import { useState, useEffect } from "react";

export default function Recipient({ id, updateRecipient, availableTickets, deleteRecipient }) {
 
    const [recipient, setRecipient] = useState({id: id, firstName: '', lastName: '', email: '', tickets: 0});
    const [raffleCount, setRaffleCount] = useState(0);

    useEffect(() => {
        updateRecipient(recipient);
    }, [recipient]);
    
    useEffect(() => {
        updateRecipient({
            ...recipient,
            tickets: raffleCount
        });
    }, [raffleCount]);

    const updateFirstName = (e) => {
        setRecipient({
            ...recipient,
            firstName: e.target.value
          });
    }
    const updateLastName = (e) => {
        setRecipient({
            ...recipient,
            lastName: e.target.value
          });
    }
    const updateEmail = (e) => {
        setRecipient({
            ...recipient,
            email: e.target.value
          });
    }

    const increaseCount = () => {
        setRaffleCount((prevCount) => {
            const newCount = Number(prevCount) + 1;
            if (availableTickets >= 1) {
                return newCount > 9999 ? 9999 : newCount;
            }
            else {
                return Number(prevCount);
            }
        });
    }
    
    
    const decreaseCount = () => {
        setRaffleCount((prevCount) => {
            const newCount = Number(prevCount) - 1;
            return newCount < 0 ? 0 : newCount;
        });
    }
    
    const handleRaffleCount = (e) => {
        const inputValue = e.target.value;
        
        if (inputValue === "" || (/^\d+$/.test(inputValue) && inputValue.length <= 4 && Number(inputValue) <= Number(availableTickets))) {
            const newValue = inputValue === "" ? 0 : (Number(inputValue) < 0 ? 0 : Number(inputValue));
            setRaffleCount(newValue);
        }
    }
    
    

    return (
        <div className="recipient" key={recipient.id} style={{ borderTop: (recipient.id === 0) ? 'none' : '1px solid #d3d7e2' }}>
            <input type="text" className="recipient-input" onChange={updateFirstName} placeholder="First name*" />
            <input type="text" className="recipient-input" onChange={updateLastName} placeholder="Last name*" />
            <input type="email" className="recipient-email" onChange={updateEmail} placeholder="email@cerberus.com" />
            <div className="ticket-selector">
                <input
                    type="text"
                    className="counter-input"
                    value={raffleCount}
                    onChange={handleRaffleCount}
                    style={{
                        color: (raffleCount > 0) ? '#3f5278' : '#919cb5'
                    }}
                />
                <div className="arrows-wrap">
                    <img src="/images/arrow-select.svg" className="counter up" alt="arrow" onClick={() => increaseCount()} style={{
                        transform: 'rotate(180deg)'
                    }} />
                    <img src="/images/arrow-select.svg" className="counter down" alt="arrow" onClick={() => decreaseCount()} />
                </div>
            </div>
            <img src="/images/trash-icon.svg" alt="trash" className="trash" onClick={() => deleteRecipient(id)} style={{
                display: (id === 0) ? 'none' : 'block'
            }} />
        </div>
    );
}
