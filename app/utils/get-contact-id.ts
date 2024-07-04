import { Params } from "@remix-run/react";
import invariant from "tiny-invariant";

export function getContactId(params: Params) {
  invariant(params.contactId, "Missing contactId param");
  return params.contactId;
}
