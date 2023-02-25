import axios from 'axios'


export function placeOrder(formObject) {
    axios.post('/orders', formObject).then((res) => {
        setTimeout(() => {
            window.location.href = '/customer/orders';
        }, 1000);
    }).catch((err)=> {
       console.log(err)
    })
}