import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import { format } from "date-fns";

export default function BookingDateRange() {
  const [range, setRange] = useState([
    {
      startDate: new Date(),
      endDate: new Date(),
      key: 'selection'
    }
  ]);

  return (
    <DateRange
      editableDateInputs={true}
      moveRangeOnFirstSelection={false}
      ranges={range}
      onChange={item => setRange([item.selection])}
      minDate={new Date()} // prevent past dates
    />
  );
}
