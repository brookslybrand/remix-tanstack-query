import {
  Form,
  NavLink,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  json,
  redirect,
  useLoaderData,
  useNavigation,
  useSubmit,
  ClientLoaderFunctionArgs,
} from "@remix-run/react";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import appStylesHref from "./app.css?url";
import { createEmptyContact, getContacts } from "./data";
import { useEffect } from "react";
import {
  cacheAllContacts,
  getContactsFromCache,
  queryClient,
} from "./utils/query.client";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: appStylesHref },
];

export const action = async () => {
  const contact = await createEmptyContact();
  return redirect(`/contacts/${contact.id}/edit`);
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const q = getQuery(request);
  const contacts = await getContacts(q);
  return json({ contacts, q });
};

function getQuery(request: Request) {
  const url = new URL(request.url);
  return url.searchParams.get("q");
}

export const clientLoader = async ({
  request,
  serverLoader,
}: ClientLoaderFunctionArgs) => {
  console.log("revalidating");
  const q = getQuery(request);

  const fetchAndCacheContacts = async () => {
    const data = await serverLoader<typeof loader>();
    cacheAllContacts(data.contacts);
    return { ...data, q };
  };

  // if there's a query string, always fetch from the server
  if (q) {
    return await fetchAndCacheContacts();
  }

  // Check for existing data in the cache
  const contacts = getContactsFromCache();
  if (contacts.length > 0) {
    console.log(queryClient.getQueriesData({ queryKey: ["contacts"] })[0]);

    return { contacts, q };
  }

  console.log("fetch it all again");
  // If there's no query string and no data in the cache, fetch from the server
  return await fetchAndCacheContacts();
};

clientLoader.hydrate = true;

export default function App() {
  const { contacts, q } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const searching =
    navigation.location &&
    new URLSearchParams(navigation.location.search).has("q");

  useEffect(() => {
    const searchField = document.getElementById("q");
    if (searchField instanceof HTMLInputElement) {
      searchField.value = q || "";
    }
  }, [q]);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <div id="sidebar">
          <h1>Remix Contacts</h1>
          <div>
            <Form
              id="search-form"
              onChange={(event) => {
                const isFirstSearch = q === null;
                submit(event.currentTarget, {
                  replace: !isFirstSearch,
                });
              }}
              role="search"
            >
              <input
                id="q"
                defaultValue={q || ""}
                aria-label="Search contacts"
                className={searching ? "loading" : ""}
                placeholder="Search"
                type="search"
                name="q"
              />
              <div hidden={!searching} id="search-spinner" aria-hidden />
            </Form>
            <Form method="post">
              <button type="submit">New</button>
            </Form>
          </div>
          <nav>
            {contacts.length ? (
              <ul>
                {contacts.map((contact) => (
                  <li key={contact.id}>
                    <NavLink
                      prefetch="intent"
                      className={({ isActive, isPending }) =>
                        isActive ? "active" : isPending ? "pending" : ""
                      }
                      to={`contacts/${contact.id}`}
                    >
                      {contact.first || contact.last ? (
                        <>
                          {contact.first} {contact.last}
                        </>
                      ) : (
                        <i>No Name</i>
                      )}{" "}
                      {contact.favorite ? <span>★</span> : null}
                    </NavLink>
                  </li>
                ))}
              </ul>
            ) : (
              <p>
                <i>No contacts</i>
              </p>
            )}
          </nav>
        </div>
        <div
          className={
            navigation.state === "loading" && !searching ? "loading" : ""
          }
          id="detail"
        >
          <Outlet />
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
