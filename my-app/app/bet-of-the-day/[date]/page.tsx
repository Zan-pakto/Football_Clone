import BetOfTheDayView from "@/components/BetOfTheDayView";

export default async function BetOfTheDayDatePage(props: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await props.params;
  return <BetOfTheDayView initialDay={date} />;
}
