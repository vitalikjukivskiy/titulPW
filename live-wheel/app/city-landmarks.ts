// Незмінні історичні споруди міста; у кожного власника також є окремий будинок.
export type CityLandmark={id:string;title:string;owners:string[];icon:string;note:string};
export const CITY_LANDMARKS:CityLandmark[]=[
 {id:"sed-antoni",title:"Замок Сед Ентоні",owners:["Сед Ентоні"],icon:"🏰",note:"Фортеця над містом"},
 {id:"topchyk",title:"Офіс великих планів",owners:["Топчик"],icon:"🏢",note:"Усі на нараду"},
 {id:"thunders",title:"Кланхол Тандерів",owners:["Псіна","Xenus"],icon:"⚡",note:"Спільна база Тандерів"},
 {id:"lissafari",title:"Тихий Ліс",owners:["LisSafari"],icon:"🌲",note:"Тихе місце серед дерев"},
 {id:"sima",title:"Квітковий сад",owners:["Sima"],icon:"🌷",note:"Квіти цілий рік"},
 {id:"minato",title:"Майстерня хелпера",owners:["MinaTo (Вова)"],icon:"🛠️",note:"Місце для хотфіксів"},
 {id:"centauri",title:"Озеро спокійного фарму",owners:["Centauri"],icon:"🎣",note:"Тиша біля води"},
 {id:"proxima",title:"Парк атракціонів",owners:["Proxima"],icon:"🎡",note:"Міський двіж"},
 {id:"boss",title:"Штаб міської охорони",owners:["Дядя Босс"],icon:"🛡️",note:"Місто під захистом"},
 {id:"rodriguez",title:"Будиночок із характером",owners:["RODRIGUEZ"],icon:"🏡",note:"Історична садиба"},
 {id:"aidius",title:"Міська серверна",owners:["aidius"],icon:"🖥️",note:"Серце міської мережі"},
 {id:"mar1s",title:"Завод енергетиків",owners:["Mar1s"],icon:"🏭",note:"Енергія для стрімів"}
];
