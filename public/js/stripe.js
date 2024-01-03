/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51OTGeUJ31lZT3DuTErQ66UvrxVYrdOShnUILOWwmsN2CydxeQk6q7OvmbdkSoH08TTQ3CIt3RxCfkFNFgiMmsY2x00ysdW3FH0'
);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
