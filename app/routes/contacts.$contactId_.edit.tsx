import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  ClientActionFunctionArgs,
  ClientLoaderFunctionArgs,
  Form,
  redirect,
  useLoaderData,
  useNavigate,
} from "@remix-run/react";

import { getContact, updateContact } from "../data";
import { getContactId } from "~/utils/get-contact-id";
import { cacheContactDetail, getContactFromCache } from "~/utils/query.client";
import { useHydrated } from "~/utils/use-hydrated";

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const contactId = getContactId(params);
  const formData = await request.formData();
  const isClientAction = formData.get("clientAction") === "1";
  // need to delete the hidden input here since the next step is naive
  formData.delete("clientAction");
  const updates = Object.fromEntries(formData);

  const contact = await updateContact(contactId, updates);
  const redirectUrl = `/contacts/${contact.id}`;
  if (isClientAction) {
    return { contact, redirectUrl };
  }
  throw redirect(redirectUrl);
};

export const clientAction = async ({
  serverAction,
}: ClientActionFunctionArgs) => {
  const { contact, redirectUrl } = await serverAction<typeof action>();
  cacheContactDetail(contact);
  throw redirect(redirectUrl);
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const contactId = getContactId(params);
  const contact = await getContact(contactId);
  if (!contact) {
    throw new Response("Not Found", { status: 404 });
  }
  return json({ contact });
};

export const clientLoader = async ({
  serverLoader,
  params,
}: ClientLoaderFunctionArgs) => {
  const contactId = getContactId(params);
  const contact = getContactFromCache(contactId);
  if (contact) {
    return { contact };
  }
  return await serverLoader<typeof loader>();
};

export default function EditContact() {
  const { contact } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const isHydrated = useHydrated();

  return (
    <Form key={contact.id} id="contact-form" method="post">
      <p>
        <span>Name</span>
        <input
          defaultValue={contact.first}
          aria-label="First name"
          name="first"
          type="text"
          placeholder="First"
        />
        <input
          aria-label="Last name"
          defaultValue={contact.last}
          name="last"
          placeholder="Last"
          type="text"
        />
      </p>
      <label>
        <span>Twitter</span>
        <input
          defaultValue={contact.twitter}
          name="twitter"
          placeholder="@jack"
          type="text"
        />
      </label>
      <label>
        <span>Avatar URL</span>
        <input
          aria-label="Avatar URL"
          defaultValue={contact.avatar}
          name="avatar"
          placeholder="https://example.com/avatar.jpg"
          type="text"
        />
      </label>
      <label>
        <span>Notes</span>
        <textarea defaultValue={contact.notes} name="notes" rows={6} />
      </label>
      <p>
        <input type="hidden" name="clientAction" value={isHydrated ? 1 : 0} />
        <button type="submit">Save</button>
        <button onClick={() => navigate(-1)} type="button">
          Cancel
        </button>
      </p>
    </Form>
  );
}
