export interface IZoneItem {
  id: number;
  name: string;
  code: string;
}

export interface IZoneDistanceResult {
  fromZoneId: number;
  toZoneId: number;
  distanceM: number;
}
