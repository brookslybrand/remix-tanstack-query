import { remember } from "@epic-web/remember";
import { QueryClient } from "@tanstack/react-query";
import { ContactRecord } from "~/data";

export const queryClient = remember("react-query", () => new QueryClient());

type ContactQueryParams = {
  contactId: string;
  queryFn?: () => Promise<ContactRecord>;
};
export function createContactDetailQuery({
  contactId,
  queryFn,
}: ContactQueryParams) {
  return {
    queryKey: ["contacts", "detail", contactId],
    queryFn,
  };
}

export const contactDetailQuery = (id: string) => ({
  queryKey: ["contacts", "detail", id],
  // queryFn: async () => getContact(id), // What could we do here?
});

export function getContactsFromCache() {
  const contacts: ContactRecord[] = [];
  for (const [, contactMaybe] of queryClient.getQueriesData<ContactRecord>({
    queryKey: ["contacts"],
  })) {
    if (!contactMaybe) continue;
    contacts.push(contactMaybe);
  }
  return contacts;
}

export function getContactFromCache(contactId: string) {
  const query = contactDetailQuery(contactId);
  return queryClient.getQueryData<ContactRecord>(query.queryKey);
}

export function cacheContactDetail(contact: ContactRecord) {
  const { queryKey } = createContactDetailQuery({ contactId: contact.id });
  console.log("caching this", queryKey, contact);
  queryClient.setQueryData(queryKey, contact);
}

export function ensureContactQuery(args: ContactQueryParams) {
  return queryClient.ensureQueryData(createContactDetailQuery(args));
}

export function cacheAllContacts(contacts: ContactRecord[]) {
  contacts.forEach((contact) => {
    const query = contactDetailQuery(contact.id);

    queryClient.setQueryData(query.queryKey, contact);
  });
}
