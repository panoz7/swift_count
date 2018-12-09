let states = `California
Oregon
Washington
Idaho
Nevada
North Dakota
South Dakota
Wyoming
Montana
Utah
Arizona
Colorado
New Mexico
Texas
Oklahoma
Arkansas
Nebraska
Kansas
Missouri
Michigan
Illinois
Indiana
Wisconsin
Minnesota
Ohio
Kentucky
West Virgina
Tennessee
Pensylvania
Delaware
Maryland
Virgina
North Carolina
South Carolina
Georgia
Florida
Alabama
Mississippi
Louisiana
New Jersey
New York
Mass
Conn
Rhode Island
Vermont
New Hampshire
Maine
Hawaii
Alaska
Iowa`;

let a = states.split('\n');

console.log(a.sort(a,b => a > b));