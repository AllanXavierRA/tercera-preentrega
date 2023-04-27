import { request, response } from "express";
import axios from "axios";
import mongoose from "mongoose";
import { ObjectId } from 'mongodb';
import { Cart } from "../dao/model/cart.js"
import { User } from '../dao/model/users.js'
import { Producto } from "../dao/model/producto.js";
import { Ticket, generadorTicketUnico } from "../dao/model/ticket.js";

const cartPost = async( req = request, res = response) => {
    const body = req.body;

    const cart = new Cart(body);
    await cart.save();


    res.json({
        cart
    })
}  



const cartGet = async( req=request, res=response) => {

    const {cid} = req.params;
    const cart = await Cart.findById( cid ).populate('products.id');

    res.json({
        cart
    })
}

const deleteProductOfCart = async(cid, pid) => {

    const cart = await Cart.findByIdAndUpdate( cid, { $pull: {products: {id: pid}}}, {new: true});

}

const cartPurchaser = async(req=request,res=response) => {
    const { cid } = req.params;
    const body = req.body;
    const cart = await Cart.findById(cid).populate('products.id')

    let monto = [];
    
    // RESTANDO LA CANTIDAD DE PRODUCTOS DEL STOCK
    const cartStockProd = await Promise.all(
        cart.products.map(async (product) => {
            const foundProduct = await Producto.findById(product.id._id);
            if(foundProduct.stock > product.quantity && foundProduct.stock != 0){
                const stock =  (foundProduct.stock - product.quantity)
                foundProduct['stock'] = stock;
                try {
                    await foundProduct.save();
                    monto.push(product.quantity * foundProduct.price);
                    console.log(foundProduct._id);
                    deleteProductOfCart(cid, foundProduct._id)
                    return foundProduct;
                } catch (error) {
                    console.error("Error al guardar el producto:", error);
                  }
            }else{
                foundProduct['stock'] = foundProduct.stock
                return foundProduct
            }
        })
    )


    let num = 0
    monto.forEach(numero => {
        num += numero
    })


    const user = await User.find({cartId: cid})


    const ticket = new Ticket({
        amount: num,
        purchaser: user[0].email
    })

    ticket.code = await generadorTicketUnico();

    await ticket.save();



    res.json({
        cart
    })   
}


const postProductToCart = async( req=request, res=response ) => {

    const {cid, pid} = req.params;
    

    
    if (!mongoose.Types.ObjectId.isValid(cid)) {
        return res.status(400).json({ message: 'El ID del carrito no es válido' });
    }else if(!mongoose.Types.ObjectId.isValid(pid)){
        return res.status(400).json({ message: 'El ID del producto no es válido'})
    }

    const cart = await Cart.findById(cid);

    if (!cart) {
        return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const productIndex = cart.products.findIndex(p => p.id.equals(new ObjectId(pid)));

    if(productIndex !== -1){
        cart.products[productIndex].quantity += 1;
    }else{

        cart.products.push({ id: pid, quantity: 1});
    }


    await cart.save();

    res.json({
        cart
    })
}


const cartDelete = async ( req=request, res=response ) => {

    const {cid, pid} = req.params;

    if (!mongoose.Types.ObjectId.isValid(cid)) {
        return res.status(400).json({ message: 'El ID del carrito no es válido' });
    }else if(!mongoose.Types.ObjectId.isValid(pid)){
        return res.status(400).json({ message: 'El ID del producto no es válido' })
    }

    const cart = await Cart.findByIdAndUpdate( cid, { $pull: {products: {id: pid}}}, {new: true});

    if(!cart){
        return res.status(400).json({message: "Carrito no encontrado"})
    }

    res.json({
        cart
    })

}


const cartDeleteProducts = async ( req=request, res=response ) => {

    const {cid} = req.params;
    
    if(!mongoose.Types.ObjectId.isValid(cid)){
        return res.status(400).json({message: 'El ID del carrito no es válido'})
    }

    const cart = await Cart.findByIdAndUpdate( cid, { $set: {products: []}}, {new: true})

    if(!cart){
        return res.status(400).json({message: "Carrito no encontrado"})
    }

    res.json({
        cart
    })

}




export {
    cartPost,
    cartGet,
    postProductToCart,
    cartDelete,
    cartDeleteProducts,
    cartPurchaser
}

