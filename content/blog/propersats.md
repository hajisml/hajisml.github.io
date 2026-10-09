---
{
  "title": "Land, Law, and Lightning: Building Trustless Real Estate in a Caffeine-Fueled Weekend",
  "slug": "propersats",
  "date": "2026-06-14",
  "summary": "A beginner’s guide to Lightning development through ProperSats — a multi-sig Lightning escrow for Kenyan land purchases, built in a 24-hour hackathon at Zone01 Kisumu. 3rd place out of 16 teams.",
  "cover": "https://media2.dev.to/dynamic/image/width=1200,height=627,fit=cover,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fg1999pzettlt2xg5i1m7.png",
  "tags": [
    "Bitcoin",
    "Lightning",
    "FastAPI",
    "React",
    "Hackathon"
  ],
  "canonical": "https://dev.to/hajisml/land-law-and-lightning-building-trustless-real-estate-in-a-caffeine-fueled-weekend-1elj",
  "persona": "dev",
  "draft": false
}
---
### ⚡ A Beginner’s Guide to Lightning Development via the ProperSats Hackathon Project

![ProperSats Team at Kisumu Lightning Developer Bootcamp](https://media2.dev.to/dynamic/image/width=800,height=,fit=scale-down,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fccwownu3bbdoxekzmvtj.jpg)

It’s 3 AM. The only things keeping my brain from turning into mush are a lukewarm cup of coffee and the rhythmic flickering of a terminal window. We’re in the final stretch of a brutal, adrenaline-fueled 24-hour hackathon.

Just five days ago, a room full of passionate developers gathered at **Zone01 Kisumu** for an intensive 5-Day Lightning Network Development Bootcamp sponsored by Africa Free Routing, Btrust, HRF, and Tether. We went from stripping away monetary theory on Day 1 to writing custom automation scripts on Day 2. By Day 3 and 4, our whiteboards were covered in architecture schemas for payment channels, HTLCs, and wallet APIs.

Then came Day 5: the hackathon.

Instead of building a standard wallet clone, our team decided to "disrupt" real estate. Because, you know, moving traditional legal systems onto a Layer 2 Bitcoin protocol in under 24 hours is a totally relaxed weekend activity.

Welcome to **ProperSats**.

---

## The Problem: The "Shamba" Scramble

In Kenya, buying a piece of land—a *shamba*—is less like a business transaction and more like a game of Russian Roulette. You pay a seller, the seller disappears, and it turns out the "lawyer" validating the deed was actually the seller’s cousin in an oversized suit. Fraud, double-allocation, and missing land registries are massive structural bottlenecks.

We wanted to solve this by bringing **actual plots for sale** onto the **[Lightning Network](https://lightning.network/)**. Why Layer 2? Because waiting 10 minutes for a base-layer Bitcoin block to confirm is a lifetime when you’re worried the seller might jump on a motorbike and vanish into the Kisumu traffic before the transaction is even broadcast. We needed instant, final settlement wrapped in programmatic trust.

---

## Ground Zero: Setting Up Base Layer Development

Before you can build on the Lightning Network, you have to understand the foundation it rests upon: **[Bitcoin Core](https://bitcoincore.org/)** (`bitcoind`).

### 1. Installation & Running a Native Node

To set up a local development sandbox (known as `regtest` or regression test mode), you install Bitcoin Core. On a Linux development machine, you can grab the binaries or build it natively. Once installed, you configure a local daemon by creating a `bitcoin.conf` file:

```ini
# ~/.bitcoin/bitcoin.conf
regtest=1
server=1
rpcuser=your_bootcamp_user
rpcpassword=your_secure_password
rpcallowip=127.0.0.1
```

Fire up the daemon in the background:

```bash
bitcoind -daemon
```

### 2. Interfacing via `bitcoin-cli` and RPC

With the node running, you use `bitcoin-cli` to interact with your blockchain via Remote Procedure Calls (**[RPC](https://developer.bitcoin.org/reference/rpc/)**). This allows your backend applications to talk to the blockchain programmatically.

To test your connection, request basic node status information:

```bash
bitcoin-cli -regtest getblockchaininfo
```

To simulate transactions, you need blocks. In `regtest`, you can instantly mine blocks to your own wallet address to generate simulated transaction confirmations:

```bash
# Create a development wallet
bitcoin-cli -regtest createwallet "bootcamp_wallet"

# Generate an address
ADDR=$(bitcoin-cli -regtest getnewaddress)

# Mine 101 blocks to pass the coinbase maturity rule and get spendable sats
bitcoin-cli -regtest generatetoaddress 101 $ADDR
```

---

## Demystifying the Jargon: What is SegWit?

When diving into Bitcoin documentation, you will immediately run into terms like **[SegWit (Segregated Witness)](https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki)**. It sounds highly complex, but the core concept is straightforward:

In traditional Bitcoin transactions, the data that proves you own the funds (the cryptographic signature or "witness" data) was packed tightly alongside the transaction layout details (inputs and outputs) inside the rigid 1MB block size limit.

- **The Segregation:** SegWit literally *segregates* (separates) the heavy signature data from the base transaction data.
- **The Benefit:** By moving the signatures into a dedicated structure, it freed up massive space inside the block layout. This effectively allowed blocks to carry more transactions, lower fees, and fixed a critical bug called *transaction malleability* (changing a transaction's ID before it confirms).
- **Why it matters for Lightning:** Without SegWit fixing transaction malleability, building secure payment channels on the Lightning Network would be structurally impossible. It is the architectural anchor that allows unconfirmed Layer 2 states to safely chain together.

---

## Streamlining with Polar (And a Major Linux Hurdle)

Manually configuring multiple interconnected Bitcoin nodes, LND daemons, and liquidity paths on a terminal can quickly consume an entire hackathon weekend. That is where **[Polar](https://lightningpolar.com/)** comes in.

Polar is a visual wrapper that allows you to drag, drop, and launch an entire network of Bitcoin Core nodes, LND, Core Lightning (CLN), and eclair instances inside isolated **[Docker](https://www.docker.com/)** containers with a single click. It completely automates the local funding and channel creation process.

![Polar Network topology](https://media2.dev.to/dynamic/image/width=800,height=,fit=scale-down,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2F59qb6k92k8uy6ytutqpa.png)

### 🛑 The Hackathon Hurdle: The `/var/run/docker.sock` Lockout

While setting things up on our Linux machines, our team hit a classic developer roadblock. Polar fired up perfectly, but it completely failed to spin up any nodes, throwing generic connection errors.

**The Root Cause:** Polar interfaces directly with the local Docker daemon using the Unix socket file located at `/var/run/docker.sock`. By default on many Linux distributions, this socket file is locked down with strict `root` user ownership permissions for security. Because Polar runs in user space, it was denied read/write access to the socket.

**The Fix:** We had to bridge the permission gap by adding our Linux user accounts directly to the `docker` system group, giving Polar the clearance it needed without requiring dangerous global `chmod 777` overrides.

```bash
# 1. Create the docker group if it doesn't exist
sudo groupadd docker

# 2. Add your current system user to the docker group
sudo usermod -aG docker $USER

# 3. Apply the group changes instantly to the current terminal session
newgrp docker
```

> ⚠️ **Important Linux Gotcha:** While running `newgrp docker` authorizes the current terminal window immediately, your desktop environment and graphical application runners (like your application launcher or IDE) won't inherit this permission change yet. To get Polar or VS Code to recognize Docker system-wide, **you must log out of your Linux session and log back in (or perform a full system reboot).**

Once the session cleared, Polar instantly recognized the Docker engine, letting us spin up Alice, Bob, and our multi-sig application channels instantly.

---

## The ProperSats Stack: Keeping it Simple

### The Backend: FastAPI & Python

Our backend interfaces with **[LND (Lightning Network Daemon)](https://lightning.engineering/lnd/)** via its REST API to generate an invoice for a specific real estate plot. Here is a simplified version of how we handled the invoice generation using **[FastAPI](https://fastapi.tiangolo.com/)** and **[Python](https://www.python.org/)**:

```python
import httpx

async def create_invoice(amount_sats: int, memo: str):
    url = f"{LND_URL}/v1/invoices"
    headers = {"Grpc-Metadata-macaroon": LND_MACAROON}
    payload = {"value": str(amount_sats), "memo": memo}

    async with httpx.AsyncClient(verify=False) as client:
        response = await client.post(url, json=payload, headers=headers)
        return response.json()
```

### The Frontend: React & WebLN

On the client side, we leveraged **[WebLN](https://webln.guide/)** to trigger the user's wallet automatically when they find a plot they like. No clunky copy-pasting required:

```javascript
const handlePayment = async (paymentRequest) => {
  if (window.webln) {
    await window.webln.enable();
    const result = await window.webln.sendPayment(paymentRequest);
    console.log("Payment successful:", result.preimage);
  }
};
```

---

## More Hurdles: Integration in the Trenches

Beyond Docker conflicts, programming directly with cryptographic transaction states introduced a few more brick walls:

1. **The SSL "Wall":** LND uses self-signed certificates for local development. Browsers absolutely *hate* this. We spent a frustrating hour wondering why **[Alby](https://getalby.com/)** wouldn't connect before realizing we had to manually hit the LND port in a separate browser tab to bypass the security warning. When that orange Alby logo finally lit up, the collective cheer from our workstation corner was louder than my laptop's cooling fan.
2. **Macaroon Musical Chairs:** Multi-sig real estate transactions mean managing multiple roles (Buyer, Seller, Lawyer). This translates to managing multiple **[macaroons](https://lightning.engineering/api-docs/api/lnd/)** (LND's cryptographic credential tokens). If you accidentally pass Bob’s macaroon when you meant to use Alice’s, you’re trying to authorize a sweep using the wrong identity. The backend will notice immediately, and it will be incredibly grumpy about it.
3. **URL Encoding Nightmares:** Lightning payment hashes (`r_hash`) are random raw bytes. Passing them raw inside API endpoints breaks your routing because they naturally contain slashes (`/`) or plus signs (`+`). Standardizing our pipeline on **[Base64](https://datatracker.ietf.org/doc/html/rfc4648)** encoding/decoding saved our sanity.

---

## How the Demo Actually Works

The core innovation of ProperSats is our **Multi-Sig Escrow** logic tailored for property acquisition:

![ProperSats DFD](https://media2.dev.to/dynamic/image/width=800,height=,fit=scale-down,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fl2i1gmyltsqogzqqjt5i.png)

1. **Selection:** The buyer browses the platform, finds a verified *shamba*, and clicks "Buy". The backend generates a Lightning invoice.
2. **Instant Escrow:** The buyer pays the invoice instantly via WebLN/Alby.
3. **Locked State:** The funds do not go straight to the seller. They stay locked in a virtual "Pending Escrow" state inside our backend.
4. **Multi-Party Verification:** A verified **Surveyor** must confirm the boundaries, and a **Lawyer** must verify the legal deed ownership. Both must sign off via the platform.
5. **Settlement:** Once both approvals hit the backend, the escrow releases the funds automatically to the seller. If fraud is detected, the transaction is aborted and refunded.

![ProperSats Purchase Demo](https://media2.dev.to/dynamic/image/width=800,height=,fit=scale-down,gravity=auto,format=auto/https%3A%2F%2Fdev-to-uploads.s3.amazonaws.com%2Fuploads%2Farticles%2Fef9liw0qsns37kthfcen.gif)

---

## Lessons from the Trenches

ProperSats was a wild ride. Out of 16 incredible competing teams who pushed through the absolute limit, our team secured a **3rd Place podium finish overall!** 🥉

A massive, well-deserved shoutout to my teammate **[Elizabeth Omito](https://linkedin.com/in/elizabeth-omito)**, who was an absolute hero. While I was buried chest-deep in the terminal fixing last-minute integration bugs and wrestling with API routing, she stepped up completely, built the entire presentation slide deck, and kept our delivery on target.

We won some sats! I won't disclose the exact split, but let's just say I can now afford a very premium cup of coffee—and maybe a single, microscopic digital brick for my future house.

If a group of developers can build a working decentralized escrow system in less than 120 hours of exposure, you can definitely build your first Layer 2 script today. The open-source financial landscape in Africa is being built right now.

*Just remember to keep the coffee fresh.* ☕⚡

---

**Find our project on GitHub:** [hajisml/propersats](https://github.com/hajisml/propersats)
