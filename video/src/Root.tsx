import { Composition } from "remotion";
import { Moment0602 } from "./Moment0602";
import { SickDay } from "./SickDay";

export const Root = () => (
  <>
    <Composition id="WobsMoment0602" component={Moment0602} durationInFrames={600} fps={30} width={1080} height={1920} />
    <Composition id="WobsSickDay" component={SickDay} durationInFrames={690} fps={30} width={1080} height={1920} />
  </>
);
