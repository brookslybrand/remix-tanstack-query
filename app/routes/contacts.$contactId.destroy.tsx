import type { ActionFunctionArgs } from "@remix-run/node";

import { deleteContact } from "../data";
import { removeContactFromCache } from "~/utils/query.client";
import { ClientActionFunctionArgs, redirect } from "@remix-run/react";
import { getContactId } from "~/utils/get-contact-id";

export const action = async ({ params }: ActionFunctionArgs) => {
  await deleteContact(getContactId(params));
  throw redirect("/");
};

export const clientAction = async ({
  serverAction,
  params,
}: ClientActionFunctionArgs) => {
  const contactId = getContactId(params);
  // TODO: add error handling
  try {
    await serverAction();
  } catch (redirectOrError) {
    removeContactFromCache(contactId);
    throw redirectOrError;
  }
};
