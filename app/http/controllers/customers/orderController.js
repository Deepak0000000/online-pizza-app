const { find } = require('laravel-mix/src/File');
const Order = require('../../../models/order')
const moment = require('moment')
const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY)

function orderController() {
    return{
        store(req,res){
            console.log(req.body)
            return;
            // validate request 

            const { phone,address,stripeToken,paymentType} = req.body;
            if(!phone || !address){
                return res.status(422).json({message : "All fields are required"});
            }

            const order = new Order({
                customerId : req.user._id,
                items:req.session.cart.items,
                phone,
                address:address
            })
            order.save().then(result =>{
                Order.populate(result,{path:'customerId'},(err,placedOrder)=>{
                    // req.flash('success','Order placed successfully')
                    // Stripe paymentType 
                    if(paymentType === 'card'){
                        stripe.charges.create({
                            amount:req.session.cart.totalPrice * 100,
                            source:stripeToken,
                            currency:'inr',
                            description:`Pizza order:${placedOrder._id}`
                        }).then(()=>{
                            placedOrder.paymentStatus = true
                            placedOrder.paymentStatus = paymentType
                            placedOrder.save().then((ord)=>{
                                const eventEmitter = req.app.get('eventEmitter')
                                eventEmitter.emit('orderPlaced',ord )
                                    
                                delete req.session.cart.cart
                                return res.json({success:'Payment successful,order placed successfully'})
                            }).catch(()=>{
                                console.log((err)=>{
                                    console.log(err)
                                })
                            })

                            

                        }).catch((err)=>{
                                
                           delete req.session.cart.cart
                            return res.json({success:'You can pay at delivery time'})

                        })

                    }else{
                        delete req.session.cart.cart
                        return res.json({success:'Order Placed Succesfully'})
                    }
                   //  Emit 
              

                   
                //    return res.redirect('/customer/orders')

                })
               
               
            }).catch(err =>{
                return res.status(500).json({success:'something went wrong'})
                // req.flash('error','something went wrong')
                // return res.redirect('/cart')
            })
          
        },
      async  index(req,res) {
            const orders = await Order.find({customerId : req.user._id},
                null, 
                {sort:{'createdAt':-1}})
                
            res.render('customers/orders',{orders:orders , moment:moment})
         
            },
           async show(req,res){
              const order = await  Order.findById(req.params.id)
              // Authorize user 
              if(req.user._id.toString() === order.customerId.toString()){
               return res.render('customers/singleOrder',{order:order})
              }
               return res.redirect('/')
              

            }

        }

    }

module.exports = orderController;