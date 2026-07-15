import { mapFinom } from "./csvMappers/finom";
import { mapMoss } from "./csvMappers/moss";
import { mapSparkasse } from "./csvMappers/sparkasse";
import type { ImportSource, TransactionData } from "./csvMappers/types";
import { mapVolksbank } from "./csvMappers/volksbank";

export type { TransactionData } from "./csvMappers/types";

const mappers: Record<
  ImportSource,
  (row: Record<string, string>) => TransactionData
> = {
  moss: mapMoss,
  sparkasse: mapSparkasse,
  volksbank: mapVolksbank,
  finom: mapFinom,
};

export function mapCSVRow(
  row: Record<string, string>,
  source: ImportSource,
): TransactionData {
  return mappers[source](row);
}
