import {db,fail,json} from "@/lib/show";
import {ensureCityTables,type CityMember,type CityLevel} from "@/lib/city";
export async function GET(){
 try{
  await ensureCityTables();
  const [members,levels]=await Promise.all([
   db().prepare("SELECT name,note FROM city_members ORDER BY joined_at,name").all<CityMember>(),
   db().prepare("SELECT building_key,level FROM city_levels").all<CityLevel>()
  ]);
  return json({members:members.results,levels:Object.fromEntries(levels.results.map(x=>[x.building_key,x.level]))});
 }catch(e){console.error("city GET",e);return fail("Зараз не вдалося завантажити оновлення міста.",503)}
}
