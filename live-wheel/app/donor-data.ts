// Дані зі списку донатів, наданого власником (55 гривневих платежів, 15.10—01.11.2026),
// плюс окремі $T-донати та історичні мешканці. НЕ повна історія Donatello.
// Ідентифікатори транзакцій, приватні дані й тестові 123-записи не публікуються.
export type Donor = { name:string; total:number|null; count:number; kind:"verified"|"tokens"|"resident"; note?:string };
export const DONORS:Donor[]=[
  {
    "name": "CYBER",
    "total": 4000,
    "count": 2,
    "kind": "verified"
  },
  {
    "name": "YouTube NOTACTICC",
    "total": 1850,
    "count": 11,
    "kind": "verified"
  },
  {
    "name": "собачка",
    "total": 1000,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "Псіна",
    "total": 850,
    "count": 4,
    "kind": "verified"
  },
  {
    "name": "Legolasik",
    "total": 766,
    "count": 3,
    "kind": "verified"
  },
  {
    "name": "Короп",
    "total": 500,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "Хто",
    "total": 500,
    "count": 2,
    "kind": "verified"
  },
  {
    "name": "MinaTo (Вова)",
    "total": 500,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "vareni4ki",
    "total": 350,
    "count": 4,
    "kind": "verified"
  },
  {
    "name": "Котику від Лиса",
    "total": 340,
    "count": 7,
    "kind": "verified"
  },
  {
    "name": "Дядя Босс",
    "total": 210,
    "count": 2,
    "kind": "verified"
  },
  {
    "name": "ghost_walker",
    "total": 200,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "Wydy",
    "total": 200,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "Лис",
    "total": 150,
    "count": 3,
    "kind": "verified"
  },
  {
    "name": "Proxima",
    "total": 150,
    "count": 2,
    "kind": "verified"
  },
  {
    "name": "Centauri",
    "total": 100,
    "count": 2,
    "kind": "verified"
  },
  {
    "name": "Galactus",
    "total": 100,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "SpeedWagon",
    "total": 100,
    "count": 2,
    "kind": "verified"
  },
  {
    "name": "Діма",
    "total": 50,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "За кота",
    "total": 50,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "За пєсню)",
    "total": 50,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "раб Некста",
    "total": 50,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "Sima",
    "total": 50,
    "count": 1,
    "kind": "verified"
  },
  {
    "name": "Сед Ентоні",
    "total": null,
    "count": 0,
    "kind": "resident",
    "note": "Замок Сед Ентоні"
  },
  {
    "name": "СедАнтоній (S-очка)",
    "total": null,
    "count": 2,
    "kind": "tokens",
    "note": "105 $T — окрема валюта"
  },
  {
    "name": "Топчик",
    "total": null,
    "count": 0,
    "kind": "resident",
    "note": "Офіс великих планів"
  },
  {
    "name": "aidius",
    "total": null,
    "count": 0,
    "kind": "resident",
    "note": "Міська серверна"
  },
  {
    "name": "LisSafari",
    "total": null,
    "count": 0,
    "kind": "resident",
    "note": "Тихий Ліс"
  },
  {
    "name": "Mar1s",
    "total": null,
    "count": 0,
    "kind": "resident",
    "note": "Завод енергетиків"
  },
  {
    "name": "RODRIGUEZ",
    "total": null,
    "count": 0,
    "kind": "resident",
    "note": "Власний будинок"
  },
  {
    "name": "Xenus",
    "total": null,
    "count": 0,
    "kind": "resident",
    "note": "Кланхол Тандерів"
  }
];
export const UAH_RECORD_COUNT=55;
export const VERIFIED_DONOR_COUNT=23;

/** Окремий публічний топ із панелі Donatello на Twitch Kit_Mihaylo (14.11.2026).
 * 4.3K / 4.0K / 1.8K — округлені панеллю значення, це не точні виплати.
 * Дані не змішуються із 55 гривневими транзакціями із часткового списку.
 */
export const PUBLIC_DONATELLO_TOP=[
{name:"СедАнтоній (S-очка)",amount:"≈ 4,3 тис. ₴"},
{name:"CYBER",amount:"≈ 4,0 тис. ₴"},
{name:"YouTube NOTACTICC",amount:"≈ 1,8 тис. ₴"},
{name:"собачка",amount:"≈ 1,0 тис. ₴"},
{name:"Псіна",amount:"850 ₴"},
{name:"Legolasik",amount:"766 ₴"},
{name:"Котику від Лиса",amount:"740 ₴"},
{name:"Sima",amount:"600 ₴"},
{name:"MinaTo (Вова)",amount:"500 ₴"},
{name:"Короп",amount:"500 ₴"}
] as const;
