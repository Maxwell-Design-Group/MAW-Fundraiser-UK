import Accordion from "~/components/Accordion";
import Recipient from "~/components/Recipient";
import { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";

export function meta() {
    return [
      {title: 'Make-A-Wish Fundraiser'},
      {description: 'Cerberus Make-A-Wish Fundraiser'},
    ];
  }
  
export async function loader({ context }) {
      const products = await context.storefront.query(PRODUCTS_QUERY);
      return {products};
}

const PRODUCTS_QUERY = `#graphql
  query products {
    products(first: ${1}) {
      edges {
        node {
          id
          title
        }
      }
    }
  }
`;

export default function Index() {

const {products} = useLoaderData();
console.log("products", products); 

const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [email, setEmail] = useState('');
const [missingKeyInfoModal, setMissingKeyInfoModal] = useState(false);
const [checkoutURl, setCheckoutUrl] = useState('');
const [continueLoader, setContinueLoader] = useState(false);

const [donorDepartmentSelect, setDonorDepartmentSelect] = useState(false);
const [department, setDepartment] = useState(null);

const [chooseDepartmentSelect, setChooseDepartmentSelect] = useState(false);
const [chooseDepartment, setChooseDepartment] = useState(null);

const [listUnderSelect, setListUnderSelect] = useState(false);
const [listSelect, setListSelect] = useState(null);
const [raffleCount, setRaffleCount] = useState(0);

const [maxId, setMaxId] = useState(1);

const [totalTickets, setTotalTickets] = useState(0);
const [availableTickets, setAvailableTickets] = useState(0);
const [reviewAndPayModal, setReviewAndPayModal] = useState(false);
// const [legalDisclaimerModal, setLegalDisclaimerModal ] = useState(false);
const [TCMOdal, setTCModal ] = useState(false);

const [recipients, setRecipients] = useState([{id: 0, firstName: '', lastName: '', email: '', tickets: 0}]);

let recipientCounter = 0;

useEffect(() => {
    let newTotal = 0;

    recipients.forEach(recipient => {
        newTotal += recipient.tickets;
    });

    setTotalTickets(newTotal);
}, [recipients]);

useEffect(() => {
    let totalTickets = recipients.reduce((total, recipient) => total + recipient.tickets, 0);
    let available = raffleCount - totalTickets;
    setAvailableTickets(available);
    console.log("available", available);
    console.log("total tickets", totalTickets);
}, [raffleCount, recipients]);

const populateFirstName = (e) => {
    setFirstName(e.target.value);
}
const populateLastName = (e) => {
    setLastName(e.target.value);
}
const populateEmail = (e) => {
    setEmail(e.target.value);
}

const increaseCount = () => {
    setRaffleCount((prevCount) => {
        const newCount = Number(prevCount) + 1;
        return newCount > 9999 ? 9999 : newCount;
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

    if (inputValue === "" || (/^\d+$/.test(inputValue) && inputValue.length <= 4)) {
        const newValue = inputValue === "" ? 0 : (Number(inputValue) < 0 ? 0 : Number(inputValue));
        setRaffleCount(newValue);
    }

}

const updateRecipient = (updatedRecipient) => {
    setRecipients((prevRecipients) => 
        prevRecipients.map((recipient) => 
            recipient.id === updatedRecipient.id ? updatedRecipient : recipient
        )
    );
}

const addRecipient = () => {
    const newId = maxId;
    setMaxId(newId + 1); 

    const newRecipient = {
        id: newId,
        firstName: '',
        lastName: '',
        email: '',
        tickets: 0
    };

    console.log("new rec", newRecipient);
    setRecipients(prevRecipients => [...prevRecipients, newRecipient]);
}

const deleteRecipient = (id) => {
    setRecipients(prevRecipients => prevRecipients.filter(recipient => recipient.id !== id));
} 

const handlePaymentInformationClick = async () => {

    const oldNote =  `{
        "first_name": "${firstName}",
        "last_name": "${lastName}",
        "department": "${department}",
        "tickets": "${raffleCount}",
        "email": "${email}",
        "where_to_list": "${listSelect}",
        ${(listSelect === 'A Cerberus Employee') ? `"recipients": [${recipients.map(r => `{"recipient_name": "${r.firstName} ${r.lastName}", "recipient_email": "${r.email}", "recipient_tickets": "${r.tickets}"}`).join(',')}]` : ``}
    }`;
    
    const note = `
        Donor: ${firstName} ${lastName};
        Donor Department: ${department};
        ${(listSelect === 'A Cerberus Employee') ? `${recipients.map(r => `Recipient: ${r.firstName} ${r.lastName}, qty: ${r.tickets}, email: ${r.email};`).join('\n')}`
        : (listSelect === 'For a Department') ? `Department: ${chooseDepartment};`
        : `Donor email: ${email};`}
    `;


    let tickets = raffleCount;
    
    setContinueLoader(true);
    
    const response = await fetch('/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note, tickets }),
      })
    .then(response => response.json())
    .then(data => {
        console.log("data from mutation", data)
        console.log("url", data.mutation.checkoutCreate.checkout.webUrl);
        setCheckoutUrl(data.mutation.checkoutCreate.checkout.webUrl);
        setContinueLoader(false);
    })
    .catch(error => {
        console.error('Error:', error)
        setContinueLoader(false);
    });

    console.log("response", response);

    let success = true;

    if (!(firstName && lastName && email && department && raffleCount && listSelect)) {
        setMissingKeyInfoModal(true);
        success = false;
    }
    if (listSelect === 'For a Department') {
        if (!chooseDepartment) {
            setMissingKeyInfoModal(true);
            success = false;
        }
    }
    if (listSelect === 'A Cerberus Employee') {
        if (recipients.some(recipient => recipient.firstName === '') || recipients.some(recipient => recipient.lastName === '') || availableTickets) {
            setMissingKeyInfoModal(true);
            success = false;
        }
    }
    
    if (success) {
        setReviewAndPayModal(true);
    }
    else {
        console.log("error");
    }
}

return (
    <div className="page_wrap">

    {missingKeyInfoModal ? 
        <div className="modal">
            <div className="overlay" onClick={() => setMissingKeyInfoModal(false)}></div>
            <div className="modal-content">
                <div className="content-header">
                    <img src="/images/warning.svg" alt="warning icon" />
                    You're missing one or more required fields
                    </div>
                {!firstName ? <div className="missing-field">First name</div> : <></>}
                {!lastName ? <div className="missing-field">Last name</div> : <></>}
                {!department ? <div className="missing-field">Your department</div> : <></>}
                {!raffleCount ? <div className="missing-field">A ticket number higher than 0</div> : <></>}
                {!email ? <div className="missing-field">Your email</div> : <></>}
                {!listSelect ? <div className="missing-field">Where to list the raffle ticket(s)</div> : <></>}
                {(listSelect === 'For a Department') ? (!chooseDepartment) ? <div className="missing-field">Department to send tickets to</div> : <></> : <></>}
                {(listSelect === 'A Cerberus Employee' && recipients.some(recipient => recipient.firstName === '')) ? <div className="missing-field">One or more recipients missing First Name field</div> : <></>}
                {(listSelect === 'A Cerberus Employee' && recipients.some(recipient => recipient.lastName === '')) ? <div className="missing-field">One or more recipients missing Last Name field</div> : <></>}
                {(listSelect === 'A Cerberus Employee' && availableTickets) ? <div className="missing-field">You have tickets that need to be distributed to recipients</div> : <></>}

                <div className="close-button" onClick={() => setMissingKeyInfoModal(false)}>Close</div>
            </div>
        </div>
        : <></>
    }
    {/* {legalDisclaimerModal ? 
        <div className="modal">
            <div className="overlay" onClick={() => setLegalDisclaimerModal(false)}></div>
            <div className="modal-content">
                <div className="content-header">Legal Disclaimer</div>
                <p className="modal-p">“The website located at [INSERT URL] (the “Site”) is owned and operated by Cerberus Capital Management, L.P. (“CCM”). The Site provides links to third-party websites. CCM’s decision to link to a third-party website is not a sponsorship, endorsement or recommendation of the third-party or the content or services in the linked third-party websites, or the security and privacy protections of those, or any other third-party websites. If you decide to access linked third-party websites, your access is governed by the terms of use and privacy and security policies of those third-party websites, and you do so at your own risk. You should direct any concerns regarding any third-party websites to the administrator of the applicable third-party website. CCM has not reviewed all the third-party websites sites that may be linked to the Site and makes no representation or commitment and accepts no responsibility for any such third-party websites, or any transactions completed, or contracts entered into by you with any such third-party or any security threats they may cause to your system.”</p>
                <div className="close-button" onClick={() => setLegalDisclaimerModal(false)}>Close</div>
            </div>
        </div> 
        : <></>
    } */}
    {TCMOdal ? 
        <div className="modal">
            <div className="overlay" onClick={() => setTCModal(false)}></div>
            <div className="modal-content">
                <div className="content-header">Terms & Conditions</div>
                <p className="modal-p">“Cerberus Raffle Fundraiser, proudly partnering with Make-A-Wish Foundation, operates on principles of transparency and commitment to the cause. By purchasing a ticket and participating in the raffle, entrants acknowledge and agree to be bound by the following terms:
                    <br /><br />
                    <b>Eligibility:</b> Open to individuals 18 years or older. Entrants must provide valid identification upon request.
                    <br />
                    <b>Entry Cost:</b> Participation requires the purchase of a raffle ticket, priced at €5 per ticket.
                    <br />
                    <b>Purpose:</b> All proceeds generated from the raffle will be channeled directly to the Make-A-Wish Foundation to support its mission.
                    <br />
                    <b>Winner Selection:</b> Winners will be chosen at random from the pool of entrants. They will be contacted directly and announced on our platform.
                    <br />
                    <b>No Transfer:</b> Raffle tickets are non-transferable and must be purchased individually.
                    <br />
                    <b>Modifications:</b> Cerberus holds the authority to alter or update these terms at any point without prior notice.
                    <br />
                    <b>Decisions:</b> All decisions regarding the raffle, including ticket sales, winner selection, and prize allocation, made by Cerberus are deemed final.
                    <br />
                    <b>Responsibility:</b> Entrants participate at their own discretion. Cerberus and Make-A-Wish Foundation are not responsible for any unintended consequences arising from participation.
                    <br />
                    By purchasing a ticket, you signify understanding and full acceptance of these terms. Together, we strive to make wishes come true.”</p>
                <div className="close-button" onClick={() => setTCModal(false)}>Close</div>
            </div>
        </div> 
        : <></>
    }
    {reviewAndPayModal ? 
        <div className="modal">
            <div className="overlay" onClick={() => setReviewAndPayModal(false)}></div>
            <div className="modal-content">
                <div className="content-header">
                    <img src="/images/review-icon.svg" alt="review icon" />
                    Review details
                </div>
                <div className="review-item">
                    First name: {firstName}
                </div>
                <div className="review-item">
                    Last name: {lastName}
                </div>
                <div className="review-item">
                    Department: {department}
                </div>
                <div className="review-item">
                    Tickets: {raffleCount}
                </div>
                <div className="review-item">
                    Email: {email}
                </div>
                {(listSelect === 'For a Department') ? <div className="review-item">
                    Department to send tickets to: {chooseDepartment}
                </div> : <></>}
                {(listSelect === 'A Cerberus Employee') ? 
                (recipients.map(recipient => {
                    return (
                        <div className="review-recipient">
                            <div className="row-header">Recipient {++recipientCounter}</div>
                            <div className="recipient-row">
                                <div className="recipient-row-item">
                                    First name: {recipient.firstName}
                                </div>
                                <div className="recipient-row-item">
                                    Last name: {recipient.lastName}
                                </div>
                                <div className="recipient-row-item">
                                    Email: {recipient.email}
                                </div>
                                <div className="recipient-row-item">
                                    Tickets: {recipient.tickets}
                                </div>
                            </div>
                        </div>
                    )
                }) ) 
                : <></>}
                <div className="confirm">If this information is correct, please go ahead and proceed to the payment using the button below:</div>
                <div className="pay-row">
                    {/* <BuyNowButton
                        className="shop-pay" 
                        variantId="gid://shopify/ProductVariant/45782004531490" 
                        quantity={raffleCount} 
                        attributes={[{note: "test"}]} 
                    >
                        Checkout
                    </BuyNowButton> */}
                    {/* <CheckoutButton /> */}
                    {/* <ShopPayButton className="shop-pay" variantIdsAndQuantities={[{id: "gid://shopify/ProductVariant/45782004531490", quantity: raffleCount}]} storeDomain="https://0ef04f.myshopify.com/" /> */}
                    {/* <button onClick={handleButtonClick}>Create Checkout</button> */}
                    
                    <a className="shop-pay" href={checkoutURl}>
                        Checkout
                        <img src="/images/arrow-payment.svg" alt="arrow" />
                    </a>

                    <div className="go-back" onClick={() => setReviewAndPayModal(false)}>Go back</div>
                </div>
            </div>
        </div>
        : <></>
    }

    <header>
        <nav>
            <div className="logo-wrapper"><img className="logo" src="/images/header-logo.svg" alt="logo" /></div>
            <ul>
                <li>
                    <a href="#donate">Donate</a>
                </li>
                <li>
                    <a href="#faq">FAQ</a>
                </li>
                <li>
                    <a href="mailto:csr@cerberus.com">Contact</a>
                </li>
            </ul>
        </nav>
    </header>
    <section className="main_sec">
        <div className="main_text_wrap">
            <h1>Cerberus Annual Make-A-<br />Wish Fundraiser</h1>
            <p>Get your tickets now for €5.00 each by clicking the link below</p>
            <a href="#donate" className="button accent_button">Get Tickets</a>
        </div>
        <img className="curves" src="/images/curves.svg" alt="curves" />
        <img className="confetti" src="/images/confetti-blue-multiple.svg" alt="confetti" />
    </section>
    <section className="sec_1">
        <img className="stars" src="/images/stars.svg" alt="stars" />
        <div className="text_wrap">
            <h2>Welcome to the Cerberus Annual Make-A-Wish Raffle Fundraiser!</h2>
            <p>Last year we partnered with Make-A-Wish UK and held our very first fundraiser at our annual UK Holiday party.
                <br /><br />
                More than 60,000 children in the UK have been diagnosed with a critical condition, changing their lives and the lives of their families forever. The power of a wish brings light and joy to children and leaves a lasting impact on all their lives.
                <br /><br />
                We managed to raise an incredible £10,000 at our launch and we are hoping to surpass this in 2023! So, please dig deep, and let’s help grant some more wishes!
            </p>
        </div>
    </section>
    <section id="donate" className="donation_sec">
        <div className="donation_sec_wrap">
            <div className="donation_form_wrap">
                <div className="donation_text">
                    <h2>Donation Form</h2>
                    <p>Raffle Tickets are €5.00 each. Grab some for yourself and your teammates.</p>
                </div>
                <form id="donation_form">
                    <input type="text" onChange={populateFirstName} className="form-input" name="donor-first-name" id="donor-first-name" placeholder="Donor First Name" />
                    <input type="text" onChange={populateLastName} className="form-input" name="donor-last-name" id="donor-last-name" placeholder="Donor Last Name" />
                    <div className="select-wrap" onClick={() => setDonorDepartmentSelect(current => !current)}>
                        <div className="panel-select-wrap" style={{
                            color: donorDepartmentSelect ? '#3f5278' : department ? '#3f5278' : '#919cb5',
                            border: donorDepartmentSelect ? '1.5px solid #acc7fd' : '1.5px solid #d3d7e2'
                        }}>
                            {department ? department : 'Donor Department'}
                            {/* {department ? <div className="selected-department">
                                Selected: {department}
                            </div> : <></>} */}
                            <img src="/images/arrow-select.svg" alt="arrow" style={{
                                transform: donorDepartmentSelect ? 'rotate(180deg)' : 'unset',
                            }} />
                        </div>
                        {donorDepartmentSelect ? <div className="selections">
                            <ul>
                                <li onClick={() => {
                                    if (department === 'Cerberus Business Finance') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Cerberus Business Finance');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Cerberus Business Finance') ? '#d4e6ff' : '#fff'
                                }}>
                                    Cerberus Business Finance
                                    {(department === 'Cerberus Business Finance') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Tax') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Tax');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Tax') ? '#d4e6ff' : '#fff'
                                }}>
                                    Tax
                                    {(department === 'Tax') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Human Resources') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Human Resources');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Human Resources') ? '#d4e6ff' : '#fff'
                                }}>
                                    Human Resources
                                    {(department === 'Human Resources') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Corporate Services') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Corporate Services');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Corporate Services') ? '#d4e6ff' : '#fff'
                                }}>
                                    Corporate Services
                                    {(department === 'Corporate Services') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'IT') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('IT');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'IT') ? '#d4e6ff' : '#fff'
                                }}>
                                    IT
                                    {(department === 'IT') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Executive') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Executive');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Executive') ? '#d4e6ff' : '#fff'
                                }}>
                                    Executive
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'Executive') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'US Corporate Credit and Distressed Debt') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('US Corporate Credit and Distressed Debt');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'US Corporate Credit and Distressed Debt') ? '#d4e6ff' : '#fff'
                                }}>
                                    US Corporate Credit and Distressed Debt
                                    {(department === 'US Corporate Credit and Distressed Debt') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Supply Chain') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Supply Chain');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Supply Chain') ? '#d4e6ff' : '#fff'
                                }}>
                                    Supply Chain
                                    {(department === 'Supply Chain') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Compliance') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Compliance');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Compliance') ? '#d4e6ff' : '#fff'
                                }}>
                                    Compliance
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'Compliance') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'MBS Compliance & Valuations') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('MBS Compliance & Valuations');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'MBS Compliance & Valuations') ? '#d4e6ff' : '#fff'
                                }}>
                                    MBS Compliance & Valuations
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'MBS Compliance & Valuations') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'COAC') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('COAC');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'COAC') ? '#d4e6ff' : '#fff'
                                }}>
                                    COAC
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'COAC') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Operations') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Operations');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Operations') ? '#d4e6ff' : '#fff'
                                }}>
                                    Operations
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'Operations') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Real Estate - Domestic') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Real Estate - Domestic');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Real Estate - Domestic') ? '#d4e6ff' : '#fff'
                                }}>
                                    Real Estate - Domestic
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'Real Estate - Domestic') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Legal') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Legal');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Legal') ? '#d4e6ff' : '#fff'
                                }}>
                                    Legal
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'Legal') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Finance') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Finance');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Finance') ? '#d4e6ff' : '#fff'
                                }}>
                                    Finance
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'Finance') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Operations - CUSS') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Operations - CUSS');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Operations - CUSS') ? '#d4e6ff' : '#fff'
                                }}>
                                    Operations - CUSS
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(department === 'Operations - CUSS') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Private Equity') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Private Equity');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Private Equity') ? '#d4e6ff' : '#fff'
                                }}>
                                    Private Equity
                                    {(department === 'Private Equity') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Global Financial Opportunities') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Global Financial Opportunities');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Global Financial Opportunities') ? '#d4e6ff' : '#fff'
                                }}>
                                    Global Financial Opportunities
                                    {(department === 'Global Financial Opportunities') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Capital Formation') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Capital Formation');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Capital Formation') ? '#d4e6ff' : '#fff'
                                }}>
                                    Capital Formation
                                    {/* <span className="department-class">Real Estate</span> */}
                                    {(department === 'Capital Formation') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Real Estate - International') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Real Estate - International');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Real Estate - International') ? '#d4e6ff' : '#fff'
                                }}>
                                    Real Estate - International
                                    {/* <span className="department-class">Real Estate</span> */}
                                    {(department === 'Real Estate - International') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Admin') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Admin');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Admin') ? '#d4e6ff' : '#fff'
                                }}>
                                    Admin
                                    {/* <span className="department-class">Real Estate</span> */}
                                    {(department === 'Admin') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Investor Services') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Investor Services');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Investor Services') ? '#d4e6ff' : '#fff'
                                }}>
                                    Investor Services
                                    {(department === 'Investor Services') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Management Company') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Management Company');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Management Company') ? '#d4e6ff' : '#fff'
                                }}>
                                    Management Company
                                    {(department === 'Management Company') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Commercial Mortgage Backed Securities') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Commercial Mortgage Backed Securities');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Commercial Mortgage Backed Securities') ? '#d4e6ff' : '#fff'
                                }}>
                                    Commercial Mortgage Backed Securities
                                    {(department === 'Commercial Mortgage Backed Securities') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Financial Services Special Situations') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Financial Services Special Situations');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Financial Services Special Situations') ? '#d4e6ff' : '#fff'
                                }}>
                                    Financial Services Special Situations
                                    {(department === 'Financial Services Special Situations') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Residential Opportunities') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Residential Opportunities');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Residential Opportunities') ? '#d4e6ff' : '#fff'
                                }}>
                                    Residential Opportunities
                                    {/* <span className="department-class">Legal</span> */}
                                    {(department === 'Residential Opportunities') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'CTS') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('CTS');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'CTS') ? '#d4e6ff' : '#fff'
                                }}>
                                    CTS
                                    {/* <span className="department-class">Legal</span> */}
                                    {(department === 'CTS') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Emerging Market Credit') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Emerging Market Credit');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Emerging Market Credit') ? '#d4e6ff' : '#fff'
                                }}>
                                    Emerging Market Credit
                                    {/* <span className="department-class">Legal</span> */}
                                    {(department === 'Emerging Market Credit') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Frontier Markets') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Frontier Markets');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Frontier Markets') ? '#d4e6ff' : '#fff'
                                }}>
                                    Frontier Markets
                                    {(department === 'Frontier Markets') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'CGI') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('CGI');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'CGI') ? '#d4e6ff' : '#fff'
                                }}>
                                    CGI
                                    {(department === 'CGI') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'International Credit') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('International Credit');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'International Credit') ? '#d4e6ff' : '#fff'
                                }}>
                                    International Credit
                                    {(department === 'International Credit') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'CES') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('CES');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'CES') ? '#d4e6ff' : '#fff'
                                }}>
                                    CES
                                    {(department === 'CES') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Communications') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Communications');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Communications') ? '#d4e6ff' : '#fff'
                                }}>
                                    Communications
                                    {(department === 'Communications') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'PSIL') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('PSIL');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'PSIL') ? '#d4e6ff' : '#fff'
                                }}>
                                    PSIL
                                    {(department === 'PSIL') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'SIRE') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('SIRE');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'SIRE') ? '#d4e6ff' : '#fff'
                                }}>
                                    SIRE
                                    {(department === 'SIRE') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'SkyCAC') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('SkyCAC');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'SkyCAC') ? '#d4e6ff' : '#fff'
                                }}>
                                    SkyCAC
                                    {(department === 'SkyCAC') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'CML') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('CML');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'CML') ? '#d4e6ff' : '#fff'
                                }}>
                                    CML
                                    {(department === 'CML') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (department === 'Non-Executive Other') {
                                        setDepartment('')
                                    }
                                    else {
                                        setDepartment('Non-Executive Other');
                                    }
                                }
                                } style={{
                                    backgroundColor: (department === 'Non-Executive Other') ? '#d4e6ff' : '#fff'
                                }}>
                                    Non-Executive Other
                                    {(department === 'Non-Executive Other') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                            </ul>
                        </div> : <></>}
                    </div>
                    <div className="raffle-selector">
                        <input 
                            type="text" 
                            className="counter-input" 
                            value={raffleCount !== 0 ? raffleCount : ''} 
                            placeholder={raffleCount === 0 ? 'Raffle Ticket(s)' : ''}
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
                    <input type="email" onChange={populateEmail} className="form-input" name="donor-email" id="donor-email" placeholder="Donor Email" />
                    <div className="select-wrap" onClick={() => setListUnderSelect(current => !current)}>
                        <div className="panel-select-wrap" style={{
                            color: listUnderSelect ? '#3f5278' : listSelect ? '#3f5278' : '#919cb5',
                            border: listUnderSelect ? '1.5px solid #acc7fd' : '1.5px solid #d3d7e2'
                        }}>
                            {listSelect ? listSelect : 'List the raffle ticket(s) under:'}
                            {/* {listSelect ? <div className="selected-department">
                                Selected: {listSelect}
                            </div> : <></>} */}
                            <img src="/images/arrow-select.svg" alt="arrow" style={{
                                transform: listUnderSelect ? 'rotate(180deg)' : 'unset',
                            }} />
                        </div>
                        {listUnderSelect ? <div className="selections">
                            <ul>
                                <li onClick={() => {
                                    if (listSelect === 'My Name') {
                                        setListSelect('')
                                    }
                                    else {
                                        setListSelect('My Name');
                                    }
                                }
                                } style={{
                                    backgroundColor: (listSelect === 'My Name') ? '#d4e6ff' : '#fff'
                                }}>
                                    My name
                                    {(listSelect === 'My Name') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (listSelect === 'A Cerberus Employee') {
                                        setListSelect('')
                                    }
                                    else {
                                        setListSelect('A Cerberus Employee');
                                    }
                                }
                                } style={{
                                    backgroundColor: (listSelect === 'A Cerberus Employee') ? '#d4e6ff' : '#fff'
                                }}>
                                    A Cerberus Employee
                                    {(listSelect === 'A Cerberus Employee') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
{/*                                 <li onClick={() => {
                                    if (listSelect === 'For a Department') {
                                        setListSelect('')
                                    }
                                    else {
                                        setListSelect('For a Department');
                                    }
                                }
                                } style={{
                                    backgroundColor: (listSelect === 'For a Department') ? '#d4e6ff' : '#fff'
                                }}>
                                    For a Department
                                    {(listSelect === 'For a Department') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li> */}
                            </ul>
                        </div> : <></>}
                    </div>

                    {(listSelect === 'For a Department') ? 
                        <div className="select-wrap" onClick={() => setChooseDepartmentSelect(current => !current)}>
                            <div className="panel-select-wrap" style={{
                                color: chooseDepartmentSelect ? '#3f5278' : chooseDepartment ? '#3f5278' : '#919cb5',
                                border: chooseDepartmentSelect ? '1.5px solid #acc7fd' : '1.5px solid #d3d7e2'
                            }}>
                                {chooseDepartment ? chooseDepartment : 'For which Department?'}
            
                                <img src="/images/arrow-select.svg" alt="arrow" style={{
                                    transform: chooseDepartmentSelect ? 'rotate(180deg)' : 'unset',
                                }} />
                            </div>
                            {chooseDepartmentSelect ? <div className="selections">
                            <ul>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Cerberus Business Finance') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Cerberus Business Finance');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Cerberus Business Finance') ? '#d4e6ff' : '#fff'
                                }}>
                                    Cerberus Business Finance
                                    {(chooseDepartment === 'Cerberus Business Finance') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Tax') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Tax');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Tax') ? '#d4e6ff' : '#fff'
                                }}>
                                    Tax
                                    {(chooseDepartment === 'Tax') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Human Resources') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Human Resources');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Human Resources') ? '#d4e6ff' : '#fff'
                                }}>
                                    Human Resources
                                    {(chooseDepartment === 'Human Resources') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Corporate Services') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Corporate Services');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Corporate Services') ? '#d4e6ff' : '#fff'
                                }}>
                                    Corporate Services
                                    {(chooseDepartment === 'Corporate Services') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'IT') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('IT');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'IT') ? '#d4e6ff' : '#fff'
                                }}>
                                    IT
                                    {(chooseDepartment === 'IT') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Executive') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Executive');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Executive') ? '#d4e6ff' : '#fff'
                                }}>
                                    Executive
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'Executive') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'US Corporate Credit and Distressed Debt') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('US Corporate Credit and Distressed Debt');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'US Corporate Credit and Distressed Debt') ? '#d4e6ff' : '#fff'
                                }}>
                                    US Corporate Credit and Distressed Debt
                                    {(chooseDepartment === 'US Corporate Credit and Distressed Debt') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Supply Chain') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Supply Chain');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Supply Chain') ? '#d4e6ff' : '#fff'
                                }}>
                                    Supply Chain
                                    {(chooseDepartment === 'Supply Chain') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Compliance') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Compliance');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Compliance') ? '#d4e6ff' : '#fff'
                                }}>
                                    Compliance
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'Compliance') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'MBS Compliance & Valuations') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('MBS Compliance & Valuations');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'MBS Compliance & Valuations') ? '#d4e6ff' : '#fff'
                                }}>
                                    MBS Compliance & Valuations
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'MBS Compliance & Valuations') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'COAC') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('COAC');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'COAC') ? '#d4e6ff' : '#fff'
                                }}>
                                    COAC
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'COAC') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Operations') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Operations');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Operations') ? '#d4e6ff' : '#fff'
                                }}>
                                    Operations
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'Operations') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Real Estate - Domestic') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Real Estate - Domestic');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Real Estate - Domestic') ? '#d4e6ff' : '#fff'
                                }}>
                                    Real Estate - Domestic
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'Real Estate - Domestic') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Legal') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Legal');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Legal') ? '#d4e6ff' : '#fff'
                                }}>
                                    Legal
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'Legal') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Finance') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Finance');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Finance') ? '#d4e6ff' : '#fff'
                                }}>
                                    Finance
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'Finance') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Operations - CUSS') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Operations - CUSS');
                                    }  
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Operations - CUSS') ? '#d4e6ff' : '#fff'
                                }}> 
                                    Operations - CUSS
                                    {/* <span className="department-class">Infrastructure</span> */}
                                    {(chooseDepartment === 'Operations - CUSS') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Private Equity') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Private Equity');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Private Equity') ? '#d4e6ff' : '#fff'
                                }}>
                                    Private Equity
                                    {(chooseDepartment === 'Private Equity') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Global Financial Opportunities') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Global Financial Opportunities');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Global Financial Opportunities') ? '#d4e6ff' : '#fff'
                                }}>
                                    Global Financial Opportunities
                                    {(chooseDepartment === 'Global Financial Opportunities') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Capital Formation') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Capital Formation');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Capital Formation') ? '#d4e6ff' : '#fff'
                                }}>
                                    Capital Formation
                                    {/* <span className="department-class">Real Estate</span> */}
                                    {(chooseDepartment === 'Capital Formation') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Real Estate - International') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Real Estate - International');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Real Estate - International') ? '#d4e6ff' : '#fff'
                                }}>
                                    Real Estate - International
                                    {/* <span className="department-class">Real Estate</span> */}
                                    {(chooseDepartment === 'Real Estate - International') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Admin') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Admin');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Admin') ? '#d4e6ff' : '#fff'
                                }}>
                                    Admin
                                    {/* <span className="department-class">Real Estate</span> */}
                                    {(chooseDepartment === 'Admin') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Investor Services') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Investor Services');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Investor Services') ? '#d4e6ff' : '#fff'
                                }}>
                                    Investor Services
                                    {(chooseDepartment === 'Investor Services') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Management Company') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Management Company');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Management Company') ? '#d4e6ff' : '#fff'
                                }}>
                                    Management Company
                                    {(chooseDepartment === 'Management Company') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Commercial Mortgage Backed Securities') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Commercial Mortgage Backed Securities');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Commercial Mortgage Backed Securities') ? '#d4e6ff' : '#fff'
                                }}>
                                    Commercial Mortgage Backed Securities
                                    {(chooseDepartment === 'Commercial Mortgage Backed Securities') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Financial Services Special Situations') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Financial Services Special Situations');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Financial Services Special Situations') ? '#d4e6ff' : '#fff'
                                }}>
                                    Financial Services Special Situations
                                    {(chooseDepartment === 'Financial Services Special Situations') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Residential Opportunities') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Residential Opportunities');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Residential Opportunities') ? '#d4e6ff' : '#fff'
                                }}>
                                    Residential Opportunities
                                    {/* <span className="department-class">Legal</span> */}
                                    {(chooseDepartment === 'Residential Opportunities') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'CTS') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('CTS');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'CTS') ? '#d4e6ff' : '#fff'
                                }}>
                                    CTS
                                    {/* <span className="department-class">Legal</span> */}
                                    {(chooseDepartment === 'CTS') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Emerging Market Credit') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Emerging Market Credit');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Emerging Market Credit') ? '#d4e6ff' : '#fff'
                                }}>
                                    Emerging Market Credit
                                    {/* <span className="department-class">Legal</span> */}
                                    {(chooseDepartment === 'Emerging Market Credit') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Frontier Markets') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Frontier Markets');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Frontier Markets') ? '#d4e6ff' : '#fff'
                                }}>
                                    Frontier Markets
                                    {(chooseDepartment === 'Frontier Markets') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'CGI') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('CGI');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'CGI') ? '#d4e6ff' : '#fff'
                                }}>
                                    CGI
                                    {(chooseDepartment === 'CGI') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'International Credit') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('International Credit');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'International Credit') ? '#d4e6ff' : '#fff'
                                }}>
                                    International Credit
                                    {(chooseDepartment === 'International Credit') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'CES') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('CES');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'CES') ? '#d4e6ff' : '#fff'
                                }}>
                                    CES
                                    {(chooseDepartment === 'CES') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Communications') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Communications');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Communications') ? '#d4e6ff' : '#fff'
                                }}>
                                    Communications
                                    {(chooseDepartment === 'Communications') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'PSIL') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('PSIL');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'PSIL') ? '#d4e6ff' : '#fff'
                                }}>
                                    PSIL
                                    {(chooseDepartment === 'PSIL') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'SIRE') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('SIRE');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'SIRE') ? '#d4e6ff' : '#fff'
                                }}>
                                    SIRE
                                    {(chooseDepartment === 'SIRE') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'SkyCAC') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('SkyCAC');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'SkyCAC') ? '#d4e6ff' : '#fff'
                                }}>
                                    SkyCAC
                                    {(chooseDepartment === 'SkyCAC') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'CML') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('CML');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'CML') ? '#d4e6ff' : '#fff'
                                }}>
                                    CML
                                    {(chooseDepartment === 'CML') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                                <li onClick={() => {
                                    if (chooseDepartment === 'Non-Executive Other') {
                                        setChooseDepartment('')
                                    }
                                    else {
                                        setChooseDepartment('Non-Executive Other');
                                    }
                                }
                                } style={{
                                    backgroundColor: (chooseDepartment === 'Non-Executive Other') ? '#d4e6ff' : '#fff'
                                }}>
                                    Non-Executive Other
                                    {(chooseDepartment === 'Non-Executive Other') ? <img src="/images/checkmark.svg" className="checkmark" alt="arrow" /> : <></>}
                                </li>
                            </ul>
                            </div> : <></>}
                        </div> : <></>}
                        
                    {(listSelect === 'For a Department') ? <div className="disclaimer department-disclaimer"><b>Disclaimer:</b> When designating tickets to a department, please be aware that the recipients will not receive any notification regarding your gift.</div> : <></>}

                    {(listSelect != 'For a Department') ?  <div className="disclaimer"><b>Disclaimer:</b> Managing Directors/Operating Executives and above are required to designate their raffle ticket(s) to another Cerberus employee(s).</div> : <></>}
                    
                    {(listSelect === 'A Cerberus Employee') ? 
                        <div className="recipients">
                            <div className="recipients-sec-title">
                                Recipient Names
                                <img src="/images/question.svg" alt="question" className="question" />
                                <p className="recipient-text">Input the information for all your recipients. You can add a new recipient by clicking the "add another" button below. On the first box, enter the recipient first name (required). On the second, enter the last name (required). On the third, enter the recipient email (optional). On the fourth box, enter the number of tickets designated to the recipient (required). The number of tickets designated between all recipients must equal the number of tickets selected above.</p>
                            </div>
                            <ul className="recipient-headers">
                                <li>First Name*</li>
                                <li>Last Name*</li>
                                <li className="email-header">Email</li>
                                <li className="tickets-header">Tickets</li>
                            </ul>
                            {recipients.map((recipient) => {
                                return (
                                    <Recipient 
                                        key={recipient.id}
                                        id={recipient.id}
                                        updateRecipient={updateRecipient}
                                        availableTickets={availableTickets}
                                        deleteRecipient={() => deleteRecipient(recipient.id)}
                                    />
                                );
                            })}
                            <div className="add-another" onClick={addRecipient}>
                                <img src="/images/add-another-icon.svg" alt="add icon" />
                                Add another
                            </div>
                            <div className="disclaimer recipient-disclaimer"><b>Disclaimer:</b> Please provide recipients email if you would like them to be notified of your gift.</div>
                        </div>
                        : <></>
                    }
                    <div className="payment-sec">
                        {continueLoader ? <div className="payment-button">
                            <img className="spinner" src="/images/spinner.svg" alt="arrow" />
                        </div> :
                        <div className="payment-button" onClick={handlePaymentInformationClick}>
                            Continue
                            <img src="/images/arrow-payment.svg" alt="arrow" />
                        </div>}
                        <div className="total-price">
                            Total Order: <div>€<span>{raffleCount * 5}</span>.00</div>
                        </div>
                    </div>
                </form>
            </div>
            <img className="donation_img" src="/images/image1.jpg" alt="image of make-a-wish child" />
        </div>
    </section>
    <section id="faq" className="faq_sec">
        <img className="faq_stars" src="/images/faq-stars.svg" alt="stars" />
        <div className="faq_sec_wrap">
            <h2>Frequently Asked Questions</h2>
            <div className="faq_box_wrap">
                <Accordion 
                    question="How are my recipients notified that I purchased tickets on their behalf?"
                    answer="If you designate tickets for other Cerberus employees and provide their email address, they will receive an email notification letting them know you purchased tickets on their behalf."
                />
                <Accordion 
                    question="What is the limit on raffle ticket purchases?"
                    answer="There is no limit on the number of raffle tickets you can purchase! We encourage you to buy as many tickets as you want since 100% of proceeds go towards Make-a-Wish UK granting wishes for kids."
                />
                <Accordion 
                    question="Can I purchase tickets multiple times?"
                    answer="Yes, you can purchase tickets as many times as you like!"
                />
                <Accordion 
                    question="Where does my donation go?"
                    answer="100% of tickets sales goes to funding wishes for the kids and families of Make-A-Wish UK."
                />
                <Accordion 
                    question="Where can I get a donation receipt?"
                    answer="Once your donation is processed, you will receive a receipt that includes the donation amount for your records."
                />
                <Accordion 
                    question="Will I receive a physical ticket?"
                    answer="No physical tickets will be issued. Once you make a purchase online, you will be entered into an online pool of tickets which will be drawn on the evening of the annual party."
                />
            </div>
        </div>
        <img className="curves" src="/images/curves.svg" alt="curves" />
    </section>
    <footer>
        <div className="footer_wrap">
            <div className="top_row">
                <img className="footer_logo" src="/images/footer-logo.svg" alt="logo" />
                <p>The website located at <em>maw.cerberus.com</em> (the “Site”) is owned and operated by Cerberus Capital Management, L.P. (“CCM”). The Site provides links to third-party websites. CCM’s decision to link to a third-party website is not a sponsorship, endorsement or recommendation of the third-party or the content or services in the linked third-party websites, or the security and privacy protections of those, or any other third-party websites. If you decide to access linked third-party websites, your access is governed by the terms of use and privacy and security policies of those third-party websites, and you do so at your own risk. You should direct any concerns regarding any third-party websites to the administrator of the applicable third-party website. CCM has not reviewed all the third-party websites sites that may be linked to the Site and makes no representation or commitment and accepts no responsibility for any such third-party websites, or any transactions completed, or contracts entered into by you with any such third-party or any security threats they may cause to your system.</p>
            </div>
            <div className="bottom_row">
                <div>
                    &copy;2023 Cerberus Capital Management, L.P. All Rights reserved.
                </div>
                <ul>
                    <li>
                        <a href="mailto:csr@cerberus.com">Contact Us</a>
                    </li>
                    {/* <li>
                        <div onClick={() => setLegalDisclaimerModal(true)}>Legal Disclaimer</div>
                    </li> */}
                    <li>
                        <div onClick={() => setTCModal(true)}>Terms & Conditions</div>
                    </li>
                </ul>
            </div>
        </div>
    </footer>
    </div>
);
}

