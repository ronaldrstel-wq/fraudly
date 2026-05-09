/**
 * Serialized DNS/RDAP alignment summary for scam check payloads (client-safe shape).
 */
export type DomainInfrastructure = {
  dnsResolvable: boolean;
  rdapIndicatesNotFound: boolean;
  treatAsNonExistentHost: boolean;
};
