let app = new Vue({

    el: "#app",


    data: {

        sitename: "After-School Lessons",

        showLessons: true,

        searchText: "",

        sortBy: "subject",

        sortOrder: "asc",

        cart: [],

        spaceChanges: {},

        customerName: "",

        customerPhone: "",

        checkoutMessage: "",


        lessons: [

            {
                id: 1,
                subject: "Mathematics",
                location: "Al Barsha",
                price: 80,
                spaces: 5,
                image: "images/maths.png"
            },

            {
                id: 2,
                subject: "English",
                location: "Jumeirah",
                price: 75,
                spaces: 5,
                image: "images/english.png"
            },

            {
                id: 3,
                subject: "Science",
                location: "Mirdif",
                price: 90,
                spaces: 5,
                image: "images/science.png"
            },

            {
                id: 4,
                subject: "Art",
                location: "Al Quoz",
                price: 65,
                spaces: 5,
                image: "images/art.png"
            },

            {
                id: 5,
                subject: "Music",
                location: "Dubai Marina",
                price: 100,
                spaces: 5,
                image: "images/music.png"
            },

            {
                id: 6,
                subject: "Football",
                location: "Mirdif",
                price: 70,
                spaces: 5,
                image: "images/football.png"
            },

            {
                id: 7,
                subject: "Basketball",
                location: "Jumeirah",
                price: 85,
                spaces: 5,
                image: "images/basketball.png"
            },

            {
                id: 8,
                subject: "Swimming",
                location: "Al Nahda",
                price: 95,
                spaces: 5,
                image: "images/swimming.png"
            },

            {
                id: 9,
                subject: "Coding",
                location: "Silicon Oasis",
                price: 110,
                spaces: 5,
                image: "images/coding.png"
            },

            {
                id: 10,
                subject: "Robotics",
                location: "Academic City",
                price: 120,
                spaces: 5,
                image: "images/robotics.png"
            },

            {
                id: 11,
                subject: "Diving",
                location: "Jumeirah Beach",
                price: 450,
                spaces: 5,
                image: "images/diving.png"
            },

            {
                id: 12,
                subject: "Rugby",
                location: "Academic City",
                price: 195,
                spaces: 5,
                image: "images/rugby.png"
            },

            {
                id: 13,
                subject: "Photography",
                location: "Dubai Marina",
                price: 620,
                spaces: 5,
                image: "images/photography.png"
            }

        ]

    },


    computed: {

        sortedLessons: function () {

            const query =
                this.searchText
                    .trim()
                    .toLowerCase();

            const field =
                this.sortBy;

            const order =
                this.sortOrder;


            const result =
                this.lessons.filter(function (lesson) {

                    const searchableText = [

                        lesson.subject,

                        lesson.location,

                        lesson.price,

                        lesson.spaces

                    ]
                    .join(" ")
                    .toLowerCase();


                    return searchableText.includes(
                        query
                    );

                });


            result.sort(function (a, b) {

                let comparison;


                if (
                    field === "price" ||
                    field === "spaces"
                ) {

                    comparison =
                        a[field] - b[field];

                } else {

                    comparison =
                        a[field].localeCompare(
                            b[field]
                        );

                }


                if (order === "desc") {

                    comparison =
                        -comparison;

                }


                return comparison;

            });


            return result;

        },


        groupedCart: function () {

            const grouped = [];


            for (
                let i = 0;
                i < this.cart.length;
                i++
            ) {

                const lessonId =
                    this.cart[i];


                const lesson =
                    this.findLesson(
                        lessonId
                    );


                let existingItem =
                    grouped.find(function (item) {

                        return (
                            item.lesson.id ===
                            lessonId
                        );

                    });


                if (existingItem) {

                    existingItem.quantity++;

                } else {

                    grouped.push({

                        lesson: lesson,

                        quantity: 1

                    });

                }

            }


            return grouped;

        },


        cartItemCount: function () {

            return this.cart.length;

        },


        cartTotal: function () {

            let total = 0;


            for (
                let i = 0;
                i < this.cart.length;
                i++
            ) {

                const lesson =
                    this.findLesson(
                        this.cart[i]
                    );


                if (lesson) {

                    total +=
                        lesson.price;

                }

            }


            return total;

        },


        validName: function () {

            return (

                this.customerName.trim() !== "" &&

                /^[A-Za-z ]+$/.test(
                    this.customerName
                )

            );

        },


        validPhone: function () {

            return (

                this.customerPhone !== "" &&

                /^[0-9]+$/.test(
                    this.customerPhone
                )

            );

        },


        canCheckout: function () {

            return (

                this.cart.length > 0 &&

                this.validName &&

                this.validPhone

            );

        }

    },


    methods: {

        findLesson: function (lessonId) {

            return this.lessons.find(
                function (lesson) {

                    return (
                        lesson.id ===
                        lessonId
                    );

                }
            );

        },


        addToCart: function (lesson) {

            if (lesson.spaces <= 0) {

                return;

            }


            const previousSpaces =
                lesson.spaces;


            const lastChange =
                this.spaceChanges[
                    lesson.id
                ];


            this.cart.push(
                lesson.id
            );


            lesson.spaces--;


            this.$set(
                this.spaceChanges,
                lesson.id,
                {

                    before:
                        previousSpaces,

                    delta:
                        -1,

                    version:
                        lastChange
                            ? lastChange.version + 1
                            : 1

                }
            );


            this.checkoutMessage = "";

        },


        removeOneFromCart: function (
            lessonId
        ) {

            const index =
                this.cart.indexOf(
                    lessonId
                );


            if (index === -1) {

                return;

            }


            const lesson =
                this.findLesson(
                    lessonId
                );


            if (!lesson) {

                return;

            }


            const previousSpaces =
                lesson.spaces;


            const lastChange =
                this.spaceChanges[
                    lessonId
                ];


            lesson.spaces++;


            this.cart.splice(
                index,
                1
            );


            this.$set(
                this.spaceChanges,
                lessonId,
                {

                    before:
                        previousSpaces,

                    delta:
                        1,

                    version:
                        lastChange
                            ? lastChange.version + 1
                            : 1

                }
            );


            this.checkoutMessage = "";


            if (this.cart.length === 0) {

                this.showLessons = true;

            }

        },


        checkout: function () {

            if (!this.canCheckout) {

                return;

            }


            const customer =
                this.customerName.trim();


            const selectedSpaces =
                this.cartItemCount;


            const activities =
                this.groupedCart.length;


            const total =
                this.cartTotal;


            this.checkoutMessage =

                "Thank you, " +

                customer +

                "! Your booking for " +

                selectedSpaces +

                (
                    selectedSpaces === 1
                        ? " space"
                        : " spaces"
                ) +

                " across " +

                activities +

                (
                    activities === 1
                        ? " activity"
                        : " activities"
                ) +

                " has been confirmed. Total: " +

                total +

                " AED.";


            // Clear cart
            this.cart = [];


            // Clear checkout form
            this.customerName = "";

            this.customerPhone = "";


            // Return home
            this.showLessons = true;


            window.scrollTo({

                top: 0,

                behavior: "smooth"

            });

        }

    }

});