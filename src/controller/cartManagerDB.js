import { request, response } from "express";
import mongoose from "mongoose";
import { ObjectId } from 'mongodb';
import { Cart } from "../dao/model/cart.js"
import { Producto } from "../dao/model/producto.js";
import { Ticket } from "../dao/model/ticket.js";


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


const cartPurchaser = async(req=request,res=response) => {
    const { cid } = req.params;
    const body = req.body;
    const cart = await Cart.findById(cid).populate('products.id')

    
    const cartStockProd = await Promise.all(
        cart.products.map(async (product) => {
            const foundProduct = await Producto.findById(product.id._id);
            if(foundProduct.stock > product.quantity){
                const stock =  (foundProduct.stock - product.quantity)
                foundProduct['stock'] = stock;
                try {
                    await foundProduct.save();
                    console.log("Producto guardado exitosamente.");
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




    const ticket = new Ticket({
        amount: 10,
        purchaser: 'allanraza@hotmail.com'
    })

    console.log(body);
    // console.log(cartStockProd);

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

    const cart = await Cart.findByIdAndUpdate( cid, { $pull: {products: pid}}, {new: true});

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


// const cartPurchaser = async(req=request,res=response) => {
//     const { cid } = req.params;
    
// }

export {
    cartPost,
    cartGet,
    postProductToCart,
    cartDelete,
    cartDeleteProducts,
    cartPurchaser
}

