import { useState } from "react";

export default function Accordion({question, answer}) {
 
    const [open, setOpen] = useState(false);

    return (
        <div className="accordion">
            <div className="question_wrap" onClick={() => setOpen(current => !current)}>
                {question}
                {open ? <img className="opened" src="/images/close.svg" alt="minus icon" /> : <img className="opened" src="/images/open.svg" alt="plus icon" />}
            </div>
            {open ? 
                <div className="answer_wrap">
                    {answer}
                </div>
                :
                <></>
            }
        </div>
    );
}
