export const DEALS_REWARDS_NAME = "DealsRewards";
export const ACCESS_ENTRY_PATH = "/check";
export const ACCOUNT_ROUTES = {
  dashboard: "/account/dashboard",
  customers: "/account/customers",
  trades: "/account/trades",
  invoice: "/account/invoice",
  profile: "/account/profile",
};

export const ACCESS_REDIRECT_URLS = [
  "https://www.amazon.in/dp/B0GGB6LB7N?psc=1&th=1&smid=AXOGFIT0PZZ7G&tag=dealsverse03-21",
  "https://ajiio.in/bOkFvnP",
  "https://www.amazon.in/dp/B0CP41TF6G?psc=1&th=1&smid=AXOGFIT0PZZ7G&tag=dealsverse03-21",
  "https://amzn.to/4dLGP9w",
  "https://myntr.it/fxVNrfS",
  "https://myntr.it/5BoCTnz",
  "https://amzn.to/4bYDjHH",
  "https://ajiio.in/RTzak30",
  "https://myntr.it/mjvPQ9g",
  "https://myntr.it/fm8jm2V",
  "https://ajiio.in/7bwoY8L",
  "https://myntr.it/cZEKzH0",
  "https://myntr.it/nTynRLi",
  "https://ajiio.in/s0xLCV3",
  "https://myntr.it/AUfa3Hq",
  "https://myntr.it/072lI82",
  "https://myntr.it/w2DVAHx",
  "https://myntr.it/2ihIosd",
  "https://www.amazon.in/dp/B0DPQNGH87?psc=1&th=1&smid=A2AL6IVND0I91F&tag=dealsverse03-21",
  "https://ajiio.in/5kTegfq",
  "https://amzn.to/4jmNerz",
  "https://ajiio.in/gyZ035A",
  "https://amzn.to/4t3qHEO",
  "https://amzn.to/4t9olo9",
  "https://myntr.it/mkpll7i",
  "https://amzn.to/3NSpnFY",
  "https://ajiio.in/vP8nHlS",
  "https://amzn.to/3PVQFf9",
  "https://amzn.to/4s9rPpT",
  "https://ajiio.in/kpQGn5w",
  "https://amzn.to/4bBMzAc",
  "https://fkrt.cc/hQnsKc8",
  "https://ajiio.in/0akltBw",
  "https://fkrt.cc/hQhZS6m",
  "https://ajiio.in/mL9gIse",
  "https://fkrt.cc/hUDmIUS",
  "https://www.amazon.in/dp/B0D2RGYG85?psc=1&th=1&tag=dealsverse03-21",
  "https://fkrt.cc/hUDmIUS",
  "https://ajiio.in/5ypZquy",
  "https://fkrt.cc/hjOCHoJ",
  "https://ajiio.in/bhJMWAt",
  "https://ajiio.in/2T2IZoy",
  "https://ajiio.in/a7d2CTk",
  "https://ajiio.in/fMiwowt",
  "https://amzn.to/4rLhj7O",
];

export function getRandomAccessRedirectUrl() {
  return ACCESS_REDIRECT_URLS[Math.floor(Math.random() * ACCESS_REDIRECT_URLS.length)];
}

export function mapLegacyBrokerPath(pathname = "", search = "", hash = "") {
  let nextPath = ACCESS_ENTRY_PATH;

  if (pathname === "/broker" || pathname === "/broker/") {
    nextPath = ACCOUNT_ROUTES.dashboard;
  } else if (pathname === "/broker/login") {
    nextPath = ACCESS_ENTRY_PATH;
  } else if (pathname.startsWith("/broker/")) {
    nextPath = pathname.replace(/^\/broker/, "/account");
  }

  return `${nextPath}${search}${hash}`;
}
