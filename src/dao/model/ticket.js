import { Schema, model } from "mongoose";
import randomstring from "randomstring";



const TicketSchema = new Schema({
    code: {
        type: String,
        unique: true
    },
    purchase_datetime: {
        type: Date
    },
    amount: {
        type: Number
    },
    purchaser: {
        type: String,
    }
})

export const Ticket = model('Ticket', TicketSchema);


export const generadorTicketUnico = async() => {

    let code = randomstring.generate(8);
    let ticket = await Ticket.findOne({ code: code }).exec();


    while (ticket) {
        
        code = randomstring.generate(8);
        ticket = await Ticket.findOne({ code: code }).exec();

    }

    return code

}