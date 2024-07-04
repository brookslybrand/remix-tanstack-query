import type { ActionFunctionArgs } from "@remix-run/node";
import invariant from "tiny-invariant";

import { deleteContact } from "../data";
import { contactDetailQuery, queryClient } from "~/utils/query.client";
import { ClientActionFunctionArgs, redirect } from "@remix-run/react";

export const action = async ({ params }: ActionFunctionArgs) => {
  invariant(params.contactId, "Missing contactId param");
  await deleteContact(params.contactId);
  return {};
};

export const clientAction = async ({
  serverAction,
  params,
}: ClientActionFunctionArgs) => {
  const { contactId } = params;
  invariant(contactId, "Missing contactId param");
  // TODO: Implement the error handling
  await serverAction();
  const query = contactDetailQuery(contactId);
  queryClient.removeQueries({ queryKey: query.queryKey });
  return redirect("/");
};
