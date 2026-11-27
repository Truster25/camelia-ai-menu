# Why the payment step is simulated

A question that comes up when this project is shown, in plain words.

---

## The short answer

The app records **how** a guest intends to pay and **whether the restaurant has
received** that money. It does not move money. Camelia takes payment at the
counter or on MoMo exactly as it does today; the app is the order pad, not the
till.

## Why it is built this way

**A real gateway is a business decision, not a coding one.** To take card or
mobile money online, the restaurant needs a merchant account in its own name,
a settlement bank account, and a signed agreement with the provider. Those are
Camelia's to sign, not something to bolt on while building a menu. Wiring a
gateway into a demo would either be fake, and dishonest, or it would need the
restaurant's credentials, which do not exist yet.

**Money has to reach Camelia's account, not ours.** A gateway tested with
somebody else's credentials is a liability, not a feature. Until the merchant
account exists, any "payment" the app claimed to take would be theatre.

**The order is still real.** What matters to the kitchen is that an order
arrives with the right dishes, the right pickup time and a known payment
intention. All three work. The guest picks cash, MoMo or card, and the order is
marked unpaid until a member of staff confirms the money arrived. That is how
most cafés in Kigali already operate, so it fits the way the restaurant works
rather than asking it to change.

## What was built instead

| Piece | What it does |
|---|---|
| Payment method | The guest chooses cash, MoMo or card when ordering |
| Payment status | Starts `unpaid`; only an admin can mark it `paid` or `refunded` |
| Guard rail | A customer cannot mark their own order paid, and the price is always recalculated on the server |
| Evidence | The order keeps its method and status, so the day's takings can be reconciled against the till |

The last row matters most. Because the order records what was promised and what
was received, adding a real gateway later is a matter of one integration: the
statuses and the audit trail are already in place.

## What it would take to go live with real money

1. Camelia opens a merchant account with a provider such as MTN MoMo or a card
   processor, in the restaurant's name.
2. We add the provider's checkout call in place of the current "record the
   intention" step.
3. The provider's confirmation webhook flips `payment_status` to `paid`, instead
   of a member of staff doing it by hand.

Nothing else in the system has to change. The order, the kitchen view and the
admin reconciliation all already work.

## How to say it if asked

> Payment is deliberately not connected to a real gateway yet. Taking money
> online needs a merchant account in Camelia's name, and that is the
> restaurant's decision to make. What is built is the part that has to be
> right first: the order records how the guest means to pay and whether the
> money has arrived, and only staff can confirm it. When the merchant account
> exists, connecting it is one integration, and the record-keeping is already
> there.
