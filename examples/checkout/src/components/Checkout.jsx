import React, { useState } from "react";
import { lift, createSequence } from "../react-continuations";

const Catalog = lift(function Catalog({ state = {}, next }) {
  const [cart, setCart] = useState(state);

  return (
    <div className="flex flex-col gap-2 p-4 items-start">
      <div>
        Shirt:
        <input
          className="border border-black p-1"
          type="number"
          value={cart.shirt ?? "0"}
          onChange={(event) =>
            setCart((cart) => ({ ...cart, shirt: +event.target.value }))
          }
        />
      </div>
      <div>
        Pants:
        <input
          className="border border-black p-1"
          type="number"
          value={cart.pants ?? "0"}
          onChange={(event) =>
            setCart((cart) => ({ ...cart, pants: +event.target.value }))
          }
        />
      </div>
      <div>
        Hat:
        <input
          className="border border-black p-1"
          type="number"
          value={cart.hat ?? "0"}
          onChange={(event) =>
            setCart((cart) => ({ ...cart, hat: +event.target.value }))
          }
        />
      </div>
      <button onClick={() => next(cart)}>Continue</button>
    </div>
  );
});

const ShippingForm = lift(function ShippingForm({ state = "", next, back }) {
  const [address, setAddress] = useState(state);

  return (
    <div className="flex flex-col gap-1">
      <input
        className="border border-black p-1"
        type="text"
        value={address}
        onChange={(event) => setAddress(event.target.value)}
      />
      <button onClick={() => back()}>Back</button>
      <button onClick={() => next(address)}>Continue</button>
    </div>
  );
});

const BillingForm = lift(function BillingForm({ state = "", next, back }) {
  const [billing, setBilling] = useState(state);

  return (
    <div className="flex flex-col gap-1">
      <input
        className="border border-black p-1"
        type="text"
        value={billing}
        onChange={(event) => setBilling(event.target.value)}
      />
      <button onClick={() => back()}>Back</button>
      <button onClick={() => next(billing)}>Continue</button>
    </div>
  );
});

const ConfirmationPage = lift(function ConfirmationPage({
  address,
  billing,
  cart,
  back,
}) {
  return (
    <div className="flex flex-col gap-1">
      <div>Buying: {JSON.stringify(cart)}</div>
      <div>Address: {address}</div>
      <div>Billing: {billing}</div>
      <button onClick={() => back()}>Back</button>
    </div>
  );
});

export const Checkout = createSequence(function* Checkout() {
  const cart = yield <Catalog />;
  const address = yield <ShippingForm />;
  const billing = yield <BillingForm />;
  yield <ConfirmationPage cart={cart} address={address} billing={billing} />;
});
