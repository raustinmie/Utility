const TEMP_PAGES = [
	"https://pacific-growers.vercel.app/",
	"https://pacific-growers.vercel.app/about",
	"https://pacific-growers.vercel.app/services",
	"https://pacific-growers.vercel.app/fundraisers",
	"https://pacific-growers.vercel.app/gallery",
	"https://pacific-growers.vercel.app/contact",
];

const PAGES_TO_CHECK = [
	// HARBORVIEW WEB DESIGN
	"https://www.harborviewwebdesign.com/",
	"https://www.harborviewwebdesign.com/services",
	"https://www.harborviewwebdesign.com/about",
	"https://www.harborviewwebdesign.com/contact",
	"https://www.harborviewwebdesign.com/faq",
	// SPRUCE IT UP LANDSCAPING
	"https://www.spruceituplandscaping.org/",
	"https://www.spruceituplandscaping.org/services",
	"https://www.spruceituplandscaping.org/about",
	"https://www.spruceituplandscaping.org/gallery",
	"https://www.spruceituplandscaping.org/contact",
	// PACIFIC NORTHWEST GUIDED TOURS
	"https://www.pacificnorthwestguidedtours.com/",
	"https://www.pacificnorthwestguidedtours.com/about",
	"https://www.pacificnorthwestguidedtours.com/tours",
	"https://www.pacificnorthwestguidedtours.com/contact",
	// PILGRIM'S QUILL
	"https://www.pilgrimsquill.com/",
	"https://www.pilgrimsquill.com/contact",
	"https://www.pilgrimsquill.com/gallery",
	"https://www.pilgrimsquill.com/services",
	"https://www.pilgrimsquill.com/about",
	// ABSOLUTE SOS
	"https://www.absolutesos.com/",
	"https://www.absolutesos.com/services",
	"https://www.absolutesos.com/about",
	"https://www.absolutesos.com/contact",
	// DEEZ EVENTS
	"https://www.deezevents.com/",
	"https://www.deezevents.com/about",
	"https://www.deezevents.com/contact",
	"https://www.deezevents.com/services/karaoke",
	"https://www.deezevents.com/services/dj-party",
	"https://www.deezevents.com/services/photo-booth",
	"https://www.deezevents.com/services/rentals",
	"https://www.deezevents.com/services/music-bingo",
	"https://www.deezevents.com/gallery",
	// FOUR SEASONS HEATING AND COOLING
	"https://www.4seasonsheating-cooling.com/",
	"https://www.4seasonsheating-cooling.com/services",
	"https://www.4seasonsheating-cooling.com/about",
	"https://www.4seasonsheating-cooling.com/contact",
	"https://www.4seasonsheating-cooling.com/faq",
	// RED BARN MARKET EVENTS
	"https://www.redbarnmarketevents.com/",
	"https://www.redbarnmarketevents.com/about",
	"https://www.redbarnmarketevents.com/vendor-information",
	"https://www.redbarnmarketevents.com/contact",
	"https://www.redbarnmarketevents.com/market-information",
	// HALF MOON'S FARM
	"https://www.halfmoonsfarm.com/",
	"https://www.halfmoonsfarm.com/about/",
	"https://www.halfmoonsfarm.com/shop/sweet-peas/",
	"https://www.halfmoonsfarm.com/shop/flower-subscriptions/",
	"https://www.halfmoonsfarm.com/contact/",
	// MEYER'S CABINETS
	"https://www.meyerscabinets.com/",
	"https://www.meyerscabinets.com/gallery/",
	"https://www.meyerscabinets.com/services/",
	"https://www.meyerscabinets.com/about/",
	"https://www.meyerscabinets.com/contact/",
	// SHAWN MARTINEZ CONSTRUCTION
	"https://www.shawnmartinezconstruction.com/",
	"https://www.shawnmartinezconstruction.com/services/",
	"https://www.shawnmartinezconstruction.com/about/",
	"https://www.shawnmartinezconstruction.com/gallery/",
	"https://www.shawnmartinezconstruction.com/contact/",
	// TRUE SURFACE CONCRETE RESTORATION
	"https://truesurfacenorthwest.com/",
	"https://truesurfacenorthwest.com/gallery",
	"https://truesurfacenorthwest.com/services",
	"https://truesurfacenorthwest.com/about",
	"https://truesurfacenorthwest.com/contact",
	"https://truesurfacenorthwest.com/reviews",
	"https://truesurfacenorthwest.com/faq",
	// LIONS CAMP HORIZON
	"https://www.lionscamphorizon.org/",
	"https://www.lionscamphorizon.org/camp",
	"https://www.lionscamphorizon.org/camper-application",
	"https://www.lionscamphorizon.org/camper-application-thank-you",
	"https://www.lionscamphorizon.org/contact",
	"https://www.lionscamphorizon.org/donate",
	"https://www.lionscamphorizon.org/facility-rentals",
	"https://www.lionscamphorizon.org/get-involved",
	"https://www.lionscamphorizon.org/policies",
	"https://www.lionscamphorizon.org/special-events",
	"https://www.lionscamphorizon.org/staff",
	"https://www.lionscamphorizon.org/thank-you",
	"https://www.lionscamphorizon.org/who-we-are",
	// WASHBOY PRESSURE WASHING
	"https://www.thewashboy.com/",
	"https://www.thewashboy.com/about",
	"https://www.thewashboy.com/contact",
	"https://www.thewashboy.com/faq",
	"https://www.thewashboy.com/gallery",
	"https://www.thewashboy.com/reviews",
	"https://www.thewashboy.com/recent-projects",
	"https://www.thewashboy.com/services/commercial-washing",
	"https://www.thewashboy.com/services/concrete-restoration",
	"https://www.thewashboy.com/services/fleet-washing",
	"https://www.thewashboy.com/services/gutter-cleaning",
	"https://www.thewashboy.com/services/pressure-washing",
	"https://www.thewashboy.com/services/roof-cleaning",
	"https://www.thewashboy.com/services/roof-repair",
	"https://www.thewashboy.com/services/soft-washing",
	"https://www.thewashboy.com/services/window-cleaning",
	// ROTHWELL MMA
	"https://www.rothwellmma.com/",
	"https://www.rothwellmma.com/about",
	"https://www.rothwellmma.com/adult-classes",
	"https://www.rothwellmma.com/contact",
	"https://www.rothwellmma.com/faq",
	"https://www.rothwellmma.com/free-class",
	"https://www.rothwellmma.com/login",
	"https://www.rothwellmma.com/member-hold",
	"https://www.rothwellmma.com/schedule",
	"https://www.rothwellmma.com/sign-up",
	"https://www.rothwellmma.com/youth-classes",
	// GTM DESIGN GROUP
	"https://www.gtmdesigngroup.com/",
	"https://www.gtmdesigngroup.com/about",
	"https://www.gtmdesigngroup.com/contact",
	"https://www.gtmdesigngroup.com/custom-work/",
	"https://www.gtmdesigngroup.com/gallery",
	"https://www.gtmdesigngroup.com/products",
	"https://www.gtmdesigngroup.com/products/card-sleeve-display",
	"https://www.gtmdesigngroup.com/products/large-dice-tower",
	"https://www.gtmdesigngroup.com/products/playmat-display",
	"https://www.gtmdesigngroup.com/products/small-dice-tower",
	// YAKIMA MMA
	"https://www.yakmma.com/",
	"https://www.yakmma.com/about",
	"https://www.yakmma.com/classes",
	"https://www.yakmma.com/faq",
	"https://www.yakmma.com/contact",
	// TCBUILDS
	"https://www.tcbuildsllc.com/",
	"https://www.tcbuildsllc.com/about",
	"https://www.tcbuildsllc.com/services",
	"https://www.tcbuildsllc.com/gallery",
	"https://www.tcbuildsllc.com/contact",
	// PEAS IN A POD
	"https://www.peasinapoddetailing.com/",
	"https://www.peasinapoddetailing.com/about",
	"https://www.peasinapoddetailing.com/services",
	"https://www.peasinapoddetailing.com/gallery",
	"https://www.peasinapoddetailing.com/maintenance",
	"https://www.peasinapoddetailing.com/pricing",
	"https://www.peasinapoddetailing.com/pod-shop",
	"https://www.peasinapoddetailing.com/faq",
	"https://www.peasinapoddetailing.com/contact",
	// RAZZFEST
	"https://www.nwraspberryfestival.com/",
	"https://www.nwraspberryfestival.com/3v3-basketball",
	"https://www.nwraspberryfestival.com/razz-and-shine",
	"https://www.nwraspberryfestival.com/music-and-entertainment",
	"https://www.nwraspberryfestival.com/raspberry-farm-tours",
	"https://www.nwraspberryfestival.com/festival-highlights",
	"https://www.nwraspberryfestival.com/vendors",
	"https://www.nwraspberryfestival.com/sponsorship",
	"https://www.nwraspberryfestival.com/contact",
	"https://www.nwraspberryfestival.com/basketball-registration",
	// CRAWL SOLUTIONS
	"https://www.crawlsolutionsllc.com/",
	"https://www.crawlsolutionsllc.com/services",
	"https://www.crawlsolutionsllc.com/about",
	"https://www.crawlsolutionsllc.com/gallery",
	"https://www.crawlsolutionsllc.com/contact",
	// ASHBURY CONSULTING
	"https://ashbury-consulting.com/",
	"https://ashbury-consulting.com/services",
	"https://ashbury-consulting.com/about",
	"https://ashbury-consulting.com/industries",
	"https://ashbury-consulting.com/contact",
	// BRIGHT SKY ELECTRIC
	"https://www.brightskyelec.com/",
	"https://www.brightskyelec.com/solar-and-battery",
	"https://www.brightskyelec.com/electrical-services",
	"https://www.brightskyelec.com/about",
	"https://www.brightskyelec.com/contact",
	// PACIFIC GROWERS
	"https://www.pacificgrowersinc.com/",
	"https://www.pacificgrowersinc.com/about",
	"https://www.pacificgrowersinc.com/services",
	"https://www.pacificgrowersinc.com/fundraisers",
	"https://www.pacificgrowersinc.com/gallery",
	"https://www.pacificgrowersinc.com/contact",
	// GRIMSBY LIFE CENTRE
	"https://www.grimsbylife.org/",
	"https://www.grimsbylife.org/services",
	"https://www.grimsbylife.org/about",
	"https://www.grimsbylife.org/get-involved",
	"https://www.grimsbylife.org/contact",
	"https://www.grimsbylife.org/coming-soon",
	// SAMISH CABINETRY
	"https://www.samishcabinetry.com/",
	"https://www.samishcabinetry.com/services",
	"https://www.samishcabinetry.com/about",
	"https://www.samishcabinetry.com/gallery",
	"https://www.samishcabinetry.com/contact",
];

const HOMEPAGE_AUDIT_RULES = {
	// "https://www.example.com/": {
	// 	ignoreCategories: ["performance"],
	// 	note: "Known third-party widget issue",
	// },
	"https://www.thewashboy.com/": {
		ignoreCategories: ["performance"],
		note: "Third party integration causes slowdowns",
	},
	"https://www.harborviewwebdesign.com/": {
		ignoreCategories: ["best practices"],
		note: "false positives",
	},
	"https://www.lionscamphorizon.org/": {
		ignoreCategories: ["best practices"],
		note: "false positives",
	},
};

const HOMEPAGES_TO_CHECK = PAGES_TO_CHECK.filter((pageUrl) => {
	try {
		const { pathname } = new URL(pageUrl);
		return pathname === "/" || pathname === "";
	} catch {
		return false;
	}
}).map((pageUrl) => ({
	url: pageUrl,
	ignoreCategories: HOMEPAGE_AUDIT_RULES[pageUrl]?.ignoreCategories || [],
	note: HOMEPAGE_AUDIT_RULES[pageUrl]?.note || "",
}));

module.exports = {
	HOMEPAGE_AUDIT_RULES,
	TEMP_PAGES,
	PAGES_TO_CHECK,
	HOMEPAGES_TO_CHECK,
};
