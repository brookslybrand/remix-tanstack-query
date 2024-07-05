import { remember } from "@epic-web/remember";
import { QueryClient } from "@tanstack/react-query";
import { ContactRecord } from "~/data";

const queryClient = remember("react-query", () => new QueryClient());

const CACHE_KEYS = {
  CONTACTS: "contacts",
  DETAIL: "detail",
} as const;

type ContactQueryParams = {
  contactId: string;
  queryFn?: () => Promise<ContactRecord>;
};

function createContactDetailQuery({ contactId, queryFn }: ContactQueryParams) {
  return {
    queryKey: [CACHE_KEYS.CONTACTS, CACHE_KEYS.DETAIL, contactId],
    queryFn,
  };
}

// all contacts helpers

export function getAllContactsFromCache() {
  const contacts: ContactRecord[] = [];
  for (const [, contactMaybe] of queryClient.getQueriesData<ContactRecord>({
    queryKey: ["contacts"],
  })) {
    if (!contactMaybe) continue;
    contacts.push(contactMaybe);
  }
  return contacts;
}

export function cacheAllContacts(contacts: ContactRecord[]) {
  contacts.forEach((contact) => {
    const query = createContactDetailQuery({ contactId: contact.id });

    queryClient.setQueryData(query.queryKey, contact);
  });
}

export function removeAllContactsFromCache() {
  queryClient.removeQueries({ queryKey: [CACHE_KEYS.CONTACTS] });
}

// contact details queries

export function getContactFromCache(contactId: string) {
  const query = createContactDetailQuery({ contactId });
  return queryClient.getQueryData<ContactRecord>(query.queryKey);
}

export function cacheContactDetail(contact: ContactRecord) {
  const { queryKey } = createContactDetailQuery({ contactId: contact.id });
  queryClient.setQueryData(queryKey, contact);
}

export function removeContactFromCache(contactId: string) {
  const query = createContactDetailQuery({ contactId });
  queryClient.removeQueries({ queryKey: query.queryKey });
}
