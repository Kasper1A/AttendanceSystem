import "./style.css";

import {
    getUsers,
    getAttendances,
    checkIn,
    checkOut,
    updateAttendance
} from "./api";

import type {
    User,
    Attendance
} from "./types";


/* =========================================================
   APP
========================================================= */

function getAppElement(): HTMLDivElement {

    const element =
        document.querySelector<HTMLDivElement>(
            "#app"
        );

    if (!element) {
        throw new Error(
            "Kunde inte hitta #app."
        );
    }

    return element;
}

const app: HTMLDivElement =
    getAppElement();


/* =========================================================
   STATE
========================================================= */

let users: User[] = [];

let attendances: Attendance[] = [];

let selectedUserId: number | null = null;

let selectedYear: number =
    new Date().getFullYear();

let selectedMonth: number =
    new Date().getMonth();


/*
 * Normal arbetsdag:
 * 8 timmar
 */
const DAILY_WORK_MINUTES =
    8 * 60;


/*
 * Lunch:
 * 60 minuter
 */
const LUNCH_MINUTES = 60;


/* =========================================================
   MONTH NAMES
========================================================= */

const MONTH_NAMES = [
    "Januari",
    "Februari",
    "Mars",
    "April",
    "Maj",
    "Juni",
    "Juli",
    "Augusti",
    "September",
    "Oktober",
    "November",
    "December"
];


/* =========================================================
   WEEKDAY NAMES
========================================================= */

const WEEKDAY_NAMES = [
    "Söndag",
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag"
];


/* =========================================================
   INIT
========================================================= */

init();


async function init(): Promise<void> {

    try {

        users =
            await getUsers();

        attendances =
            await getAttendances();

        render();

    } catch (error) {

        console.error(error);

        app.innerHTML = `
            <div class="error-screen">

                <h1>
                    Kunde inte starta systemet
                </h1>

                <p>
                    Kontrollera att backend körs
                    på http://localhost:5135
                </p>

                <button
                    id="retry-button"
                    class="primary-button"
                    type="button"
                >
                    Försök igen
                </button>

            </div>
        `;

        document
            .querySelector<HTMLButtonElement>(
                "#retry-button"
            )
            ?.addEventListener(
                "click",
                () => {
                    init();
                }
            );
    }
}


/* =========================================================
   LOGIN
========================================================= */

function renderLogin(): void {

    app.innerHTML = `
        <div class="login-page">

            <div class="login-card">

                <div class="login-header">

                    <div class="logo-mark">
                        VP
                    </div>

                    <div>

                        <h1>
                            Tidsrapport
                        </h1>

                        <p>
                            Logga in för att fortsätta
                        </p>

                    </div>

                </div>


                <form id="login-form">

                    <label for="user-id">
                        Användar-ID
                    </label>

                    <input
                        id="user-id"
                        type="number"
                        min="1"
                        placeholder="Exempelvis 1"
                        required
                    />

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Logga in
                    </button>

                </form>

            </div>

        </div>
    `;


    const form =
        document.querySelector<HTMLFormElement>(
            "#login-form"
        );


    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const input =
                document.querySelector<HTMLInputElement>(
                    "#user-id"
                );


            if (!input) {
                return;
            }


            const userId =
                Number(input.value);


            const user =
                users.find(
                    item =>
                        item.id === userId
                );


            if (!user) {

                alert(
                    "Användaren kunde inte hittas."
                );

                return;
            }


            selectedUserId =
                user.id;


            selectedYear =
                new Date().getFullYear();

            selectedMonth =
                new Date().getMonth();


            await loadAttendances();

            render();
        }
    );
}


/* =========================================================
   LOAD ATTENDANCES
========================================================= */

async function loadAttendances(): Promise<void> {

    attendances =
        await getAttendances();
}


/* =========================================================
   GET SELECTED USER
========================================================= */

function getSelectedUser(): User | null {

    if (selectedUserId === null) {
        return null;
    }

    return (
        users.find(
            user =>
                user.id === selectedUserId
        ) ?? null
    );
}


/* =========================================================
   GET USER ATTENDANCES
========================================================= */

function getUserAttendances(): Attendance[] {

    if (selectedUserId === null) {
        return [];
    }

    return attendances
        .filter(
            attendance =>
                attendance.userId ===
                selectedUserId
        )
        .sort(
            (a, b) =>
                new Date(a.checkIn).getTime() -
                new Date(b.checkIn).getTime()
        );
}


/* =========================================================
   DATE HELPERS
========================================================= */

function getDaysInMonth(
    year: number,
    month: number
): number {

    return new Date(
        year,
        month + 1,
        0
    ).getDate();
}


function getDateKey(
    date: Date
): string {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function getAttendanceDateKey(
    attendance: Attendance
): string {

    const date =
        new Date(
            attendance.checkIn
        );

    return getDateKey(date);
}


/* =========================================================
   FORMAT TIME
========================================================= */

function formatTime(
    value: string | null
): string {

    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    return date.toLocaleTimeString(
        "sv-SE",
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   CALCULATE MINUTES
========================================================= */

function calculateMinutes(
    checkInValue: string,
    checkOutValue: string | null
): number | null {

    if (!checkOutValue) {
        return null;
    }


    const start =
        new Date(checkInValue);

    const end =
        new Date(checkOutValue);


    const difference =
        Math.round(
            (
                end.getTime() -
                start.getTime()
            ) / 60000
        );


    if (difference <= 0) {
        return 0;
    }


    return Math.max(
        0,
        difference - LUNCH_MINUTES
    );
}


/* =========================================================
   FORMAT MINUTES
========================================================= */

function formatMinutes(
    minutes: number
): string {

    const sign =
        minutes < 0
            ? "-"
            : "";


    const absolute =
        Math.abs(minutes);


    const hours =
        Math.floor(
            absolute / 60
        );


    const remainingMinutes =
        absolute % 60;


    return (
        `${sign}` +
        `${hours}:` +
        `${String(
            remainingMinutes
        ).padStart(2, "0")}`
    );
}


/* =========================================================
   FORMAT SIGNED MINUTES
========================================================= */

function formatSignedMinutes(
    minutes: number
): string {

    if (minutes === 0) {
        return "0:00";
    }


    const sign =
        minutes > 0
            ? "+"
            : "-";


    return (
        sign +
        formatMinutes(
            Math.abs(minutes)
        )
    );
}


/* =========================================================
   GET RECORDS FOR DATE
========================================================= */

function getRecordsForDate(
    date: Date
): Attendance[] {

    const key =
        getDateKey(date);


    return getUserAttendances()
        .filter(
            attendance =>
                getAttendanceDateKey(
                    attendance
                ) === key
        )
        .sort(
            (a, b) =>
                new Date(a.checkIn).getTime() -
                new Date(b.checkIn).getTime()
        );
}


/* =========================================================
   DAILY WORKED MINUTES
========================================================= */

function getDailyWorkedMinutes(
    records: Attendance[]
): number {

    let total = 0;


    for (const record of records) {

        const minutes =
            calculateMinutes(
                record.checkIn,
                record.checkOut
            );


        if (minutes !== null) {

            total += minutes;
        }
    }


    return total;
}


/* =========================================================
   DAILY FLEX
========================================================= */

function getDailyFlex(
    date: Date,
    records: Attendance[]
): number {

    if (records.length === 0) {
        return 0;
    }


    const hasActiveRecord =
        records.some(
            record =>
                record.checkOut === null
        );


    if (hasActiveRecord) {
        return 0;
    }


    const workedMinutes =
        getDailyWorkedMinutes(
            records
        );


    const weekday =
        date.getDay();


    const isWeekend =
        weekday === 0 ||
        weekday === 6;


    /*
     * Helgarbete räknas som plusflex.
     */
    if (isWeekend) {
        return workedMinutes;
    }


    /*
     * Vardag:
     *
     * arbetad tid - 8 timmar
     */
    return (
        workedMinutes -
        DAILY_WORK_MINUTES
    );
}


/* =========================================================
   GET MONTH FLEX
========================================================= */

function getMonthFlex(
    year: number,
    month: number
): number {

    let total = 0;


    const days =
        getDaysInMonth(
            year,
            month
        );


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const records =
            getRecordsForDate(
                date
            );


        total +=
            getDailyFlex(
                date,
                records
            );
    }


    return total;
}


/* =========================================================
   GET FLEX BEFORE MONTH
========================================================= */

function getFlexBeforeMonth(
    year: number,
    month: number
): number {

    let total = 0;


    const firstDayOfMonth =
        new Date(
            year,
            month,
            1
        );


    const processedDays =
        new Set<string>();


    for (
        const record of getUserAttendances()
    ) {

        const date =
            new Date(
                record.checkIn
            );


        if (
            date >= firstDayOfMonth
        ) {
            continue;
        }


        const key =
            getDateKey(date);


        if (
            processedDays.has(key)
        ) {
            continue;
        }


        processedDays.add(key);


        const records =
            getRecordsForDate(
                date
            );


        total +=
            getDailyFlex(
                date,
                records
            );
    }


    return total;
}


/* =========================================================
   GET MONTH WORKED MINUTES
========================================================= */

function getMonthWorkedMinutes(
    year: number,
    month: number
): number {

    let total = 0;


    const days =
        getDaysInMonth(
            year,
            month
        );


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            new Date(
                year,
                month,
                day
            );


        const records =
            getRecordsForDate(
                date
            );


        total +=
            getDailyWorkedMinutes(
                records
            );
    }


    return total;
}


/* =========================================================
   EDIT MODAL
========================================================= */

function openEditAttendance(
    attendance: Attendance
): void {

    const checkInDate =
        new Date(
            attendance.checkIn
        );


    const checkOutDate =
        attendance.checkOut
            ? new Date(
                attendance.checkOut
            )
            : null;


    function formatForInput(
        date: Date | null
    ): string {

        if (!date) {
            return "";
        }


        const year =
            date.getFullYear();


        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");


        const day =
            String(
                date.getDate()
            ).padStart(2, "0");


        const hours =
            String(
                date.getHours()
            ).padStart(2, "0");


        const minutes =
            String(
                date.getMinutes()
            ).padStart(2, "0");


        return (
            `${year}-${month}-${day}` +
            `T${hours}:${minutes}`
        );
    }


    const modal =
        document.createElement("div");


    modal.className =
        "modal-overlay";


    modal.innerHTML = `

        <div class="edit-modal">

            <div class="modal-header">

                <div>

                    <h2>
                        Redigera arbetspass
                    </h2>

                    <p>
                        Ändra tiderna för
                        tidsregistreringen.
                    </p>

                </div>


                <button
                    class="modal-close"
                    id="close-modal"
                    type="button"
                >
                    ×
                </button>

            </div>


            <form id="edit-form">

                <div class="form-group">

                    <label for="edit-checkin">
                        Började
                    </label>

                    <input
                        id="edit-checkin"
                        type="datetime-local"
                        value="${formatForInput(
                            checkInDate
                        )}"
                        required
                    />

                </div>


                <div class="form-group">

                    <label for="edit-checkout">
                        Slutade
                    </label>

                    <input
                        id="edit-checkout"
                        type="datetime-local"
                        value="${formatForInput(
                            checkOutDate
                        )}"
                    />

                    <small>
                        Lämna tomt om arbetspasset
                        fortfarande pågår.
                    </small>

                </div>


                <div class="modal-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        id="cancel-edit"
                    >
                        Avbryt
                    </button>

                    <button
                        type="submit"
                        class="primary-button"
                    >
                        Spara
                    </button>

                </div>

            </form>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    function closeModal(): void {
        modal.remove();
    }


    document
        .querySelector<HTMLButtonElement>(
            "#close-modal"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    document
        .querySelector<HTMLButtonElement>(
            "#cancel-edit"
        )
        ?.addEventListener(
            "click",
            closeModal
        );


    const form =
        document.querySelector<HTMLFormElement>(
            "#edit-form"
        );


    form?.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const checkInInput =
                document.querySelector<HTMLInputElement>(
                    "#edit-checkin"
                );


            const checkOutInput =
                document.querySelector<HTMLInputElement>(
                    "#edit-checkout"
                );


            if (!checkInInput) {
                return;
            }


            const newCheckIn =
                checkInInput.value;


            const newCheckOut =
                checkOutInput?.value
                    ? checkOutInput.value
                    : null;


            if (
                newCheckOut &&
                new Date(newCheckOut) <
                new Date(newCheckIn)
            ) {

                alert(
                    "Utcheckningen kan inte vara före incheckningen."
                );

                return;
            }


            try {

                await updateAttendance(
                    attendance.id,
                    newCheckIn,
                    newCheckOut
                );


                await loadAttendances();

                closeModal();

                render();

            } catch (error) {

                alert(
                    error instanceof Error
                        ? error.message
                        : "Kunde inte spara ändringen."
                );
            }
        }
    );
}


/* =========================================================
   RENDER
========================================================= */

function render(): void {

    if (
        selectedUserId === null
    ) {

        renderLogin();

        return;
    }


    const user =
        getSelectedUser();


    if (!user) {

        selectedUserId =
            null;

        renderLogin();

        return;
    }


    const monthName =
        MONTH_NAMES[
            selectedMonth
        ];


    const incomingFlex =
        getFlexBeforeMonth(
            selectedYear,
            selectedMonth
        );


    const monthFlex =
        getMonthFlex(
            selectedYear,
            selectedMonth
        );


    const outgoingFlex =
        incomingFlex +
        monthFlex;


    const today =
        new Date();


    const isCurrentMonth =
        today.getFullYear() ===
            selectedYear &&
        today.getMonth() ===
            selectedMonth;


    const days =
        getDaysInMonth(
            selectedYear,
            selectedMonth
        );


    let rows = "";


    for (
        let day = 1;
        day <= days;
        day++
    ) {

        const date =
            new Date(
                selectedYear,
                selectedMonth,
                day
            );


        const weekday =
            date.getDay();


        const records =
            getRecordsForDate(
                date
            );


        const hasRecords =
            records.length > 0;


        const hasActiveRecord =
            records.some(
                record =>
                    record.checkOut === null
            );


        const workedMinutes =
            getDailyWorkedMinutes(
                records
            );


        const dailyFlex =
            getDailyFlex(
                date,
                records
            );


        const isToday =
            isCurrentMonth &&
            today.getDate() === day;


        const rowClasses = [
            "timesheet-row",

            weekday === 6
                ? "saturday"
                : "",

            weekday === 0
                ? "sunday"
                : "",

            isToday
                ? "today"
                : ""
        ]
            .filter(Boolean)
            .join(" ");


        /*
         * Första passets incheckning
         * visas som dagens start.
         */
        const firstRecord =
            records.length > 0
                ? records[0]
                : null;


        /*
         * Sista passets utcheckning
         * visas som dagens slut.
         */
        const lastRecord =
            records.length > 0
                ? records[
                    records.length - 1
                ]
                : null;


        const startTime =
            firstRecord
                ? formatTime(
                    firstRecord.checkIn
                )
                : "—";


        const endTime =
            lastRecord
                ? formatTime(
                    lastRecord.checkOut
                )
                : "—";


        const workedText =
            hasActiveRecord
                ? "Pågående"
                : hasRecords
                    ? formatMinutes(
                        workedMinutes
                    )
                    : "—";


        const flexText =
            hasRecords &&
            !hasActiveRecord
                ? formatSignedMinutes(
                    dailyFlex
                )
                : "—";


        let actionHtml = "";


        /*
         * Ett arbetspass.
         */
        if (
            records.length === 1
        ) {

            actionHtml = `
                <button
                    class="edit-button"
                    data-attendance-id="${records[0].id}"
                    type="button"
                >
                    Redigera
                </button>
            `;
        }


        /*
         * Flera arbetspass samma dag.
         */
        if (
            records.length > 1
        ) {

            actionHtml = `
                <div class="multiple-actions">

                    ${records
                        .map(
                            record => `
                                <button
                                    class="edit-button"
                                    data-attendance-id="${record.id}"
                                    type="button"
                                >
                                    Redigera
                                </button>
                            `
                        )
                        .join("")
                    }

                </div>
            `;
        }


        rows += `

            <div
                class="${rowClasses}"
            >

                <!-- DAG -->

                <div class="day-cell">
                    ${WEEKDAY_NAMES[weekday]}
                </div>


                <!-- DATUM -->

                <div class="date-cell">
                    ${day}
                </div>


                <!-- BÖRJAT -->

                <div class="time-cell">

                    ${startTime}

                    ${
                        records.length > 1
                            ? `
                                <div class="session-list">

                                    ${records
                                        .map(
                                            record => `
                                                <div
                                                    class="session-item"
                                                >
                                                    ${formatTime(
                                                        record.checkIn
                                                    )}
                                                    –
                                                    ${formatTime(
                                                        record.checkOut
                                                    )}
                                                </div>
                                            `
                                        )
                                        .join("")
                                    }

                                </div>
                            `
                            : ""
                    }

                </div>


                <!-- SLUTAT -->

                <div class="time-cell">

                    ${endTime}

                    ${
                        records.length > 1
                            ? `
                                <div class="session-list">

                                    ${records
                                        .map(
                                            record => `
                                                <div
                                                    class="session-item"
                                                >
                                                    ${formatTime(
                                                        record.checkOut
                                                    )}
                                                </div>
                                            `
                                        )
                                        .join("")
                                    }

                                </div>
                            `
                            : ""
                    }

                </div>


                <!-- ARBETAD TID -->

                <div class="number-cell">
                    ${workedText}
                </div>


                <!-- FLEX -->

                <div
                    class="
                        number-cell
                        flex-cell
                        ${
                            dailyFlex > 0
                                ? "positive"
                                : dailyFlex < 0
                                    ? "negative"
                                    : ""
                        }
                    "
                >
                    ${flexText}
                </div>


                <!-- ÅTGÄRD -->

                <div class="action-cell">
                    ${actionHtml}
                </div>

            </div>
        `;
    }


    app.innerHTML = `

        <div class="app-shell">

            <header class="topbar">

                <div class="brand">

                    <div class="logo-mark">
                        VP
                    </div>

                    <div>

                        <div class="brand-title">
                            Tidsrapport
                        </div>

                        <div class="brand-subtitle">
                            VP Autoparts
                        </div>

                    </div>

                </div>


                <div class="user-area">

                    <span>
                        ${user.name}
                    </span>

                    <button
                        id="logout-button"
                        class="logout-button"
                        type="button"
                    >
                        Logga ut
                    </button>

                </div>

            </header>


            <main class="timesheet-container">

                <div class="sheet-header">

                    <div>

                        <h1>
                            Tidsrapport
                        </h1>

                        <p class="sheet-user">

                            Namn:

                            <strong>
                                ${user.name}
                            </strong>

                        </p>

                    </div>


                    <div class="month-navigation">

                        <button
                            id="previous-month"
                            class="month-arrow"
                            type="button"
                            aria-label="Föregående månad"
                        >
                            ‹
                        </button>


                        <div class="month-title">

                            <strong>
                                ${monthName}
                            </strong>

                            <span>
                                ${selectedYear}
                            </span>

                        </div>


                        <button
                            id="next-month"
                            class="month-arrow"
                            type="button"
                            aria-label="Nästa månad"
                        >
                            ›
                        </button>

                    </div>


                    <div class="incoming-flex">

                        <span>
                            Ingående flex
                        </span>

                        <strong
                            class="
                                ${
                                    incomingFlex > 0
                                        ? "positive"
                                        : incomingFlex < 0
                                            ? "negative"
                                            : ""
                                }
                            "
                        >
                            ${formatSignedMinutes(
                                incomingFlex
                            )}
                        </strong>

                    </div>

                </div>


                <div class="clock-controls">

                    <button
                        id="check-in-button"
                        class="check-in-button"
                        type="button"
                    >
                        Klocka in
                    </button>


                    <button
                        id="check-out-button"
                        class="check-out-button"
                        type="button"
                    >
                        Klocka ut
                    </button>

                </div>


                <div class="sheet">

                    <div class="sheet-table">

                        <div class="table-header">

                            <div>
                                Dag
                            </div>

                            <div>
                                Dat.
                            </div>

                            <div>
                                Börjat
                            </div>

                            <div>
                                Slutat
                            </div>

                            <div>
                                Arb. tid
                            </div>

                            <div>
                                Flex
                            </div>

                            <div>
                                Åtgärd
                            </div>

                        </div>


                        <div class="table-body">

                            ${rows}

                        </div>

                    </div>

                </div>


                <div class="sheet-footer">

                    <div class="monthly-total">

                        <span>
                            Totalt månad:
                        </span>

                        <strong>
                            ${formatMinutes(
                                getMonthWorkedMinutes(
                                    selectedYear,
                                    selectedMonth
                                )
                            )}
                        </strong>

                    </div>


                    <div class="outgoing-flex">

                        <span>
                            Utgående flex
                        </span>

                        <strong
                            class="
                                ${
                                    outgoingFlex > 0
                                        ? "positive"
                                        : outgoingFlex < 0
                                            ? "negative"
                                            : ""
                                }
                            "
                        >
                            ${formatSignedMinutes(
                                outgoingFlex
                            )}
                        </strong>

                    </div>

                </div>

            </main>

        </div>
    `;


    setupEvents();
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents(): void {

    /* -----------------------------------------------------
       LOGOUT
    ----------------------------------------------------- */

    document
        .querySelector<HTMLButtonElement>(
            "#logout-button"
        )
        ?.addEventListener(
            "click",
            () => {

                selectedUserId =
                    null;

                render();
            }
        );


    /* -----------------------------------------------------
       PREVIOUS MONTH
    ----------------------------------------------------- */

    document
        .querySelector<HTMLButtonElement>(
            "#previous-month"
        )
        ?.addEventListener(
            "click",
            () => {

                selectedMonth--;


                if (
                    selectedMonth < 0
                ) {

                    selectedMonth = 11;

                    selectedYear--;
                }


                render();
            }
        );


    /* -----------------------------------------------------
       NEXT MONTH
    ----------------------------------------------------- */

    document
        .querySelector<HTMLButtonElement>(
            "#next-month"
        )
        ?.addEventListener(
            "click",
            () => {

                selectedMonth++;


                if (
                    selectedMonth > 11
                ) {

                    selectedMonth = 0;

                    selectedYear++;
                }


                render();
            }
        );


    /* -----------------------------------------------------
       CHECK IN
    ----------------------------------------------------- */

    document
        .querySelector<HTMLButtonElement>(
            "#check-in-button"
        )
        ?.addEventListener(
            "click",
            async () => {

                if (
                    selectedUserId === null
                ) {
                    return;
                }


                try {

                    await checkIn(
                        selectedUserId
                    );


                    await loadAttendances();


                    render();

                } catch (error) {

                    alert(
                        error instanceof Error
                            ? error.message
                            : "Kunde inte klocka in."
                    );
                }
            }
        );


    /* -----------------------------------------------------
       CHECK OUT
    ----------------------------------------------------- */

    document
        .querySelector<HTMLButtonElement>(
            "#check-out-button"
        )
        ?.addEventListener(
            "click",
            async () => {

                if (
                    selectedUserId === null
                ) {
                    return;
                }


                const activeAttendance =
                    getUserAttendances()
                        .find(
                            record =>
                                record.checkOut ===
                                null
                        );


                if (!activeAttendance) {

                    alert(
                        "Du är inte incheckad just nu."
                    );

                    return;
                }


                try {

                    await checkOut(
                        activeAttendance.id
                    );


                    await loadAttendances();


                    render();

                } catch (error) {

                    alert(
                        error instanceof Error
                            ? error.message
                            : "Kunde inte klocka ut."
                    );
                }
            }
        );


    /* -----------------------------------------------------
       EDIT BUTTONS
    ----------------------------------------------------- */

    const editButtons =
        document.querySelectorAll<HTMLButtonElement>(
            ".edit-button"
        );


    editButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset
                                .attendanceId
                        );


                    const attendance =
                        attendances.find(
                            record =>
                                record.id === id
                        );


                    if (!attendance) {
                        return;
                    }


                    openEditAttendance(
                        attendance
                    );
                }
            );
        }
    );
}