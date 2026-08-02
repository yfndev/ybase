import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateCarAllowance,
  CAR_ALLOWANCE_RATES_EUR_PER_KM,
  type CarAllowanceRate,
} from "@/lib/travel-costs";

type Props = {
  id: string;
  kilometers?: number;
  mileageRate: CarAllowanceRate;
  onUpdate: (updates: {
    mileageRate: CarAllowanceRate;
    grossAmount: number;
    netAmount: number;
  }) => void;
};

export function CarMileageRateSelect({
  id,
  kilometers,
  mileageRate,
  onUpdate,
}: Props) {
  return (
    <div>
      <Label htmlFor={id}>Kosten pro Kilometer *</Label>
      <Select
        value={String(mileageRate)}
        onValueChange={(value) => {
          const nextMileageRate = Number(value) as CarAllowanceRate;
          const amount = calculateCarAllowance(
            kilometers ?? 0,
            nextMileageRate,
          );
          onUpdate({
            mileageRate: nextMileageRate,
            grossAmount: amount,
            netAmount: amount,
          });
        }}
      >
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CAR_ALLOWANCE_RATES_EUR_PER_KM.map((rate) => (
            <SelectItem key={rate} value={String(rate)}>
              {Math.round(rate * 100)} ct/km
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
