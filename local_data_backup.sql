--
-- PostgreSQL database dump
--

\restrict Zrw89iGIBnsoXA9Yw3JQI2Hp86WDwyUhif3jcgDpOJhUBin5zI7ZMbN2DtDMcmG

-- Dumped from database version 18.0 (Postgres.app)
-- Dumped by pg_dump version 18.0 (Postgres.app)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: OrderSource; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderSource" AS ENUM (
    'POS',
    'WEBSITE'
);


--
-- Name: OrderStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrderStatus" AS ENUM (
    'PAID',
    'PENDING',
    'CANCELLED',
    'DRAFT'
);


--
-- Name: RequestStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."RequestStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


--
-- Name: Unit; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Unit" AS ENUM (
    'KG',
    'GM',
    'LTR',
    'ML',
    'PC'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'MANAGER',
    'CASHIER',
    'STAFF',
    'SUPER_ADMIN'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id text NOT NULL,
    "shopCode" text NOT NULL,
    "totalAmount" double precision NOT NULL,
    discount double precision DEFAULT 0,
    tax double precision DEFAULT 0,
    status public."OrderStatus" DEFAULT 'PAID'::public."OrderStatus" NOT NULL,
    "createdById" text,
    "customerName" text,
    "customerPhone" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "paymentMethod" text DEFAULT 'CASH'::text NOT NULL,
    "customerEmail" text,
    "orderSource" public."OrderSource" DEFAULT 'POS'::public."OrderSource" NOT NULL,
    "pickupTime" timestamp(3) without time zone
);


--
-- Name: OrderItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OrderItem" (
    id text NOT NULL,
    "orderId" text NOT NULL,
    "productId" text NOT NULL,
    quantity integer NOT NULL,
    price double precision NOT NULL,
    "productVariantId" text
);


--
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "shopCode" text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "categoryId" text,
    "isListedOnWebsite" boolean DEFAULT false NOT NULL
);


--
-- Name: ProductImage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductImage" (
    id text NOT NULL,
    url text NOT NULL,
    "productId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ProductVariant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ProductVariant" (
    id text NOT NULL,
    "productId" text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    "costPrice" double precision,
    barcode text NOT NULL,
    sku text,
    "hsnCode" text,
    quantity integer DEFAULT 0 NOT NULL,
    "minStock" integer,
    unit public."Unit",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: RoleRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."RoleRequest" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "shopCode" text NOT NULL,
    "requestedRole" public."UserRole" NOT NULL,
    status public."RequestStatus" DEFAULT 'PENDING'::public."RequestStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Shop; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Shop" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "shopCode" text NOT NULL,
    city text,
    country text,
    currency text DEFAULT 'INR'::text NOT NULL,
    email text,
    "gstNumber" text,
    phone text,
    pincode text,
    state text,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "upiId" text,
    "allowBookingWhenOutOfStock" boolean DEFAULT false NOT NULL,
    "allowNextDayBooking" boolean DEFAULT false NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "shopCode" text NOT NULL,
    "avatarUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    name text,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    role public."UserRole" DEFAULT 'STAFF'::public."UserRole" NOT NULL,
    phone text
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Category" (id, name, "createdAt") FROM stdin;
4a481bd3-903b-45bb-ba9e-b0af86ccd232	SWEETS	2026-03-26 16:35:55.457
f6460f7b-173d-426b-93d8-2b3587e7147d	DRINKS	2026-03-26 16:35:55.469
87524c0b-deea-4a33-95f7-216647a0ef8f	DRY_FRUITS	2026-03-26 16:35:55.479
9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	BAKERY	2026-03-26 16:35:55.48
ab36cb8b-d194-4f1c-bec5-975402e647d2	NAMKEEN	2026-03-26 16:35:55.481
86324965-02f9-454f-8ad7-c9180af65d3c	ICE_CREAM	2026-03-26 16:35:55.485
e47bee42-83c0-4e2a-8752-72bcb6d423bd	FAST_FOOD	2026-03-26 16:35:55.491
bf6479c6-f483-48d5-8d98-2e1346742072	GROCERY	2026-03-26 16:35:55.507
272500a4-f2b6-45b4-82a2-943a1e8d7130	CANDY	2026-03-26 16:35:55.514
\.


--
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, "shopCode", "totalAmount", discount, tax, status, "createdById", "customerName", "customerPhone", "createdAt", "paymentMethod", "customerEmail", "orderSource", "pickupTime") FROM stdin;
2e44a8d8-aaef-418b-ba41-024906098443	calcutta-main	21	0	1	PAID	6fbfdcf2-a248-45e3-a252-9963caa0e953	Gaurav	9594943933	2026-03-29 08:42:42.413	CASH	\N	POS	\N
c22862ec-73ac-4d65-877f-3b2a2d26d97d	calcutta-main	435.75	0	20.75	PAID	6fbfdcf2-a248-45e3-a252-9963caa0e953	janmejay	9849338232	2026-03-29 17:38:00.354	CASH	\N	POS	\N
cd93d4cb-bb7e-4c38-a777-7726dad71871	SH000001	115	0	0	PENDING	\N	Rahul sharma	8387678121	2026-04-03 18:45:34.409	CASH	\N	WEBSITE	2026-04-06 07:46:00
a0738ead-147e-4930-bed0-5ed0a238fc6a	SH000001	115	0	0	PENDING	\N	Janmejay Singh	9868363788	2026-04-03 18:47:33.821	CASH	\N	WEBSITE	2026-04-05 07:48:00
23e6f22c-cf15-4c71-b74f-63f1873dfdd2	SH000001	63	0	3	PAID	6fbfdcf2-a248-45e3-a252-9963caa0e953	\N	\N	2026-04-03 18:51:29.185	CASH	\N	POS	\N
bf95d69c-a686-4d5b-9292-86a2c58c7a04	SH000001	115	0	0	PENDING	\N	JJ	367638732	2026-04-03 18:58:50.441	CASH	\N	WEBSITE	2026-04-08 08:00:00
7b880c75-6ed7-4ce1-8360-a39728632632	SH000001	115	0	0	PENDING	\N	asdkjb	94724983289	2026-04-09 17:18:38.855	CASH	\N	WEBSITE	2026-04-09 17:20:00
7b4127bb-0f2f-46e8-835a-8b0a37acfcad	SH000001	115	0	0	PENDING	\N	Aman KA	84230303	2026-04-09 21:02:23.139	CASH	gggauravsingh512@gmail.com	WEBSITE	2026-04-12 09:02:00
c6ac4343-3605-4229-bfa0-b9e7b093aa7a	SH000001	115	0	0	PENDING	\N	Aman KA	84230303	2026-04-09 21:02:26.17	CASH	gggauravsingh512@gmail.com	WEBSITE	2026-04-12 09:02:00
f04d259e-d8e1-47e1-a0ac-83be617344e0	SH000001	20	0	0	PENDING	\N	asdas	asddas	2026-04-09 21:05:24.1	CASH	gaurav@gmail.com	WEBSITE	2026-04-09 21:05:00
c1f76e92-b4dd-4d94-a41a-3ecbe637494b	SH000001	20	0	0	PENDING	\N	asdas	asddas	2026-04-09 21:05:29.088	CASH	gaurav@gmail.com	WEBSITE	2026-04-09 21:05:00
\.


--
-- Data for Name: OrderItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OrderItem" (id, "orderId", "productId", quantity, price, "productVariantId") FROM stdin;
d0d6e0f8-c9a8-4ff1-9374-f732d66a0e1d	2e44a8d8-aaef-418b-ba41-024906098443	b2efdb92-7d6b-4134-b579-0cc15a266b92	1	20	94a5629c-72e3-4fa8-9469-43fe41ba6419
2db15730-a28b-4b8f-aea3-b2d65d4cbcd1	c22862ec-73ac-4d65-877f-3b2a2d26d97d	d9ef4f91-5b28-4020-a2fa-398e8463f885	1	360	25cd79fd-536f-48f7-ae4b-b9ba18e0e20b
9715afa4-6c35-4991-b076-2167b8d051f3	c22862ec-73ac-4d65-877f-3b2a2d26d97d	04756e0a-0f1a-4b90-84c3-d4eb5eea861e	1	55	6ef8d027-a997-48cd-8e44-1a8d03875467
b9a990ac-432c-4dd8-98a0-f9945a120615	cd93d4cb-bb7e-4c38-a777-7726dad71871	2a305222-fa47-4d44-adf1-764249892dbb	1	115	7a9b7dbc-b0a7-4d97-83d3-b9bd16859f58
6458de3d-7576-4a93-9912-58c4cd9839c3	a0738ead-147e-4930-bed0-5ed0a238fc6a	2a305222-fa47-4d44-adf1-764249892dbb	1	115	7a9b7dbc-b0a7-4d97-83d3-b9bd16859f58
7d39c71b-5c29-4b4f-9fb1-b05e3d7a657b	23e6f22c-cf15-4c71-b74f-63f1873dfdd2	0ffb8812-c278-4f87-93e7-f0316d5aba5b	1	20	37efbc91-3e02-4a76-b981-effb1d676f32
cfea6808-9509-48e5-8c8b-c04ecb27f9c0	23e6f22c-cf15-4c71-b74f-63f1873dfdd2	0ffb8812-c278-4f87-93e7-f0316d5aba5b	1	40	3c397e3a-fc85-4479-af44-fed8d5ab01b3
cb95f43f-cd5b-45a6-8a14-f997c6ed7291	bf95d69c-a686-4d5b-9292-86a2c58c7a04	2a305222-fa47-4d44-adf1-764249892dbb	1	115	7a9b7dbc-b0a7-4d97-83d3-b9bd16859f58
b0d46093-8170-4533-9c52-fac55cbe75d5	7b880c75-6ed7-4ce1-8360-a39728632632	2a305222-fa47-4d44-adf1-764249892dbb	1	115	7a9b7dbc-b0a7-4d97-83d3-b9bd16859f58
de105680-99b0-4294-977f-1e4d1fd2f803	7b4127bb-0f2f-46e8-835a-8b0a37acfcad	2a305222-fa47-4d44-adf1-764249892dbb	1	115	7a9b7dbc-b0a7-4d97-83d3-b9bd16859f58
0d43593a-8840-43c9-9c0f-26775e9c126f	c6ac4343-3605-4229-bfa0-b9e7b093aa7a	2a305222-fa47-4d44-adf1-764249892dbb	1	115	7a9b7dbc-b0a7-4d97-83d3-b9bd16859f58
72cbb7e7-5afb-4409-8982-4004b6a97836	f04d259e-d8e1-47e1-a0ac-83be617344e0	0ffb8812-c278-4f87-93e7-f0316d5aba5b	1	20	37efbc91-3e02-4a76-b981-effb1d676f32
eb93a7f6-ec3b-4f15-88c4-162aded7a57c	c1f76e92-b4dd-4d94-a41a-3ecbe637494b	0ffb8812-c278-4f87-93e7-f0316d5aba5b	1	20	37efbc91-3e02-4a76-b981-effb1d676f32
\.


--
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, name, "createdAt", "shopCode", description, "isActive", "updatedAt", "categoryId", "isListedOnWebsite") FROM stdin;
7fb38b95-32ba-43b9-a050-cc71ec4d7005	Fika mathri	2026-03-26 16:35:55.461	calcutta-main	\N	t	2026-03-26 16:35:55.461	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4efc2e74-2d2f-46f8-9e52-24b01cc8b1bf	Mitha mathri	2026-03-26 16:35:55.464	calcutta-main	\N	t	2026-03-26 16:35:55.464	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1f97f5d4-9211-460c-8ba1-087e6e5162a4	Khatta meetha	2026-03-26 16:35:55.465	calcutta-main	\N	t	2026-03-26 16:35:55.465	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
01d95304-5f3c-443e-9b2d-9c9cdff2e800	Maaza	2026-03-26 16:35:55.466	calcutta-main	\N	t	2026-03-26 16:35:55.466	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
12c2eb0f-7372-4531-8bc9-2a1481313476	Dry fruit laddu	2026-03-26 16:35:55.468	calcutta-main	\N	t	2026-03-26 16:35:55.468	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f72008d8-69c5-4b3f-9c93-63e80cc92dc0	Gud chana	2026-03-26 16:35:55.469	calcutta-main	\N	t	2026-03-26 16:35:55.469	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
534326d2-3d36-43e3-8806-787909471742	Real juice apple t	2026-03-26 16:35:55.47	calcutta-main	\N	t	2026-03-26 16:35:55.47	f6460f7b-173d-426b-93d8-2b3587e7147d	f
be9cfde8-628b-4660-8527-20006327d109	Real grapes juice t	2026-03-26 16:35:55.471	calcutta-main	\N	t	2026-03-26 16:35:55.471	f6460f7b-173d-426b-93d8-2b3587e7147d	f
9f524dfc-72ab-426f-9a20-2ab6e3e28d22	Futa chana	2026-03-26 16:35:55.471	calcutta-main	\N	t	2026-03-26 16:35:55.471	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
83852843-2dfd-4bc5-8f5d-a71a69de3c8f	Aam papad roll	2026-03-26 16:35:55.472	calcutta-main	\N	t	2026-03-26 16:35:55.472	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
61be9074-9541-4a1e-97d1-da191e15c836	Cheese Licks	2026-03-26 16:35:55.473	calcutta-main	\N	t	2026-03-26 16:35:55.473	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ccd867a1-93a2-4d57-b38e-43c49399eee6	Top Butter Much (Bisk Farm)	2026-03-26 16:35:55.473	calcutta-main	\N	t	2026-03-26 16:35:55.473	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9b7f73ee-4c37-49df-96ec-b9d9c3ac0575	Nice (Bisk Farm)	2026-03-26 16:35:55.474	calcutta-main	\N	t	2026-03-26 16:35:55.474	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
aae7f7e6-02e0-4b67-aece-f56358a57fe4	Chatpata Spicy (Bisk Farm)	2026-03-26 16:35:55.474	calcutta-main	\N	t	2026-03-26 16:35:55.474	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9766fbfc-1f0e-4922-9b8e-52862957b8d6	Googly (Bisk Farm)	2026-03-26 16:35:55.475	calcutta-main	\N	t	2026-03-26 16:35:55.475	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
73446396-8254-41af-8c59-a91241689d6d	Top Herbs (Bisk Farm)	2026-03-26 16:35:55.475	calcutta-main	\N	t	2026-03-26 16:35:55.475	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4350d569-fcf0-4966-a8b8-62e33e06c331	Chana Jor Salted	2026-03-26 16:35:55.476	calcutta-main	\N	t	2026-03-26 16:35:55.476	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
50187c9e-e900-4ff5-b61a-e052223a0d35	Sabudana Chips	2026-03-26 16:35:55.476	calcutta-main	\N	t	2026-03-26 16:35:55.476	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
19a64801-d521-49d1-9eff-5c8b54c61dd9	Royal Kreme	2026-03-26 16:35:55.477	calcutta-main	\N	t	2026-03-26 16:35:55.477	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2db44cfa-63ca-4ece-85bd-532496d214b3	Licks Orange (Bisk Farm)	2026-03-26 16:35:55.478	calcutta-main	\N	t	2026-03-26 16:35:55.478	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8e7df81a-b0f7-4d08-9887-486442cb9304	Jeera Wonder (Bisk Farm)	2026-03-26 16:35:55.478	calcutta-main	\N	t	2026-03-26 16:35:55.478	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7901c892-08b8-4051-b07e-9803fc39968a	Coco Malai	2026-03-26 16:35:55.479	calcutta-main	\N	t	2026-03-26 16:35:55.479	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7ba13e8a-7cb0-401f-8c28-2692c6d8798b	Pista Badam Biscuit	2026-03-26 16:35:55.48	calcutta-main	\N	t	2026-03-26 16:35:55.48	87524c0b-deea-4a33-95f7-216647a0ef8f	f
7e5979d1-9a9a-4112-87a0-4d3add571131	Nankhatai Cookies	2026-03-26 16:35:55.481	calcutta-main	\N	t	2026-03-26 16:35:55.481	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
ab83095f-012f-4afd-8c8b-0210a3b3091f	Atta Namkeen	2026-03-26 16:35:55.482	calcutta-main	\N	t	2026-03-26 16:35:55.482	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
90b5fa08-bd28-4b3a-b6ab-a29c7cc2f6b6	Honey Oats Cookies	2026-03-26 16:35:55.482	calcutta-main	\N	t	2026-03-26 16:35:55.482	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
0b5a5ad9-2c7f-4ed9-9d8e-597e4bd838ba	Multi Grain Cookies	2026-03-26 16:35:55.483	calcutta-main	\N	t	2026-03-26 16:35:55.483	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
60d46770-3d2e-43d8-9cf0-df3337a6ef47	Pulpy Orange	2026-03-26 16:35:55.483	calcutta-main	\N	t	2026-03-26 16:35:55.483	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
58182e93-205c-4226-bd5a-c3403c19cb28	Fanta	2026-03-26 16:35:55.484	calcutta-main	\N	t	2026-03-26 16:35:55.484	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
342845d1-d938-4015-8f59-6d7a4c57ac49	Real Grape Juice	2026-03-26 16:35:55.484	calcutta-main	\N	t	2026-03-26 16:35:55.484	f6460f7b-173d-426b-93d8-2b3587e7147d	f
321019fc-417c-40bc-af83-e291583cec60	Vadilal Chocolate Chips Ice Cream	2026-03-26 16:35:55.486	calcutta-main	\N	t	2026-03-26 16:35:55.486	86324965-02f9-454f-8ad7-c9180af65d3c	f
ac2749be-178d-4ce4-a5ca-0ec793096131	Vadilal Butterscotch Brick	2026-03-26 16:35:55.486	calcutta-main	\N	t	2026-03-26 16:35:55.486	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7329732c-9efe-4a37-ba32-0f70df660e64	Vadilal American Nuts	2026-03-26 16:35:55.487	calcutta-main	\N	t	2026-03-26 16:35:55.487	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9163d4f7-e13b-40ae-86ce-c48d1fe25da9	Jalebi	2026-03-26 16:35:55.487	calcutta-main	\N	t	2026-03-26 16:35:55.487	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d3b8cba1-db1d-42da-af54-41845210d5f5	Chabeni Mixture	2026-03-26 16:35:55.488	calcutta-main	\N	t	2026-03-26 16:35:55.488	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
b9d03f30-c42e-45ed-a116-9a81438f459e	Khatta Mitha Mixture	2026-03-26 16:35:55.488	calcutta-main	\N	t	2026-03-26 16:35:55.488	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
b37c1ebb-e1e2-4587-b929-49e074578123	White Chocolate Kaju	2026-03-26 16:35:55.489	calcutta-main	\N	t	2026-03-26 16:35:55.489	f6460f7b-173d-426b-93d8-2b3587e7147d	f
677a2d44-c91e-43dd-8b64-a867778bdead	Masala Sev	2026-03-26 16:35:55.489	calcutta-main	\N	t	2026-03-26 16:35:55.489	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
870f6833-6635-419f-856b-5342c1802b3e	Chhappan Bhog	2026-03-26 16:35:55.49	calcutta-main	\N	t	2026-03-26 16:35:55.49	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
930dfc0c-f967-4633-b5d5-4674191ad511	Amla Murabba	2026-03-26 16:35:55.49	calcutta-main	\N	t	2026-03-26 16:35:55.49	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
662b6b71-9c40-4e39-86e8-175557d3c5db	Mango Katli	2026-03-26 16:35:55.491	calcutta-main	\N	t	2026-03-26 16:35:55.491	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d115d5dc-9b79-4cc2-8a2b-5e0bdca3da93	Dry Samosa	2026-03-26 16:35:55.492	calcutta-main	\N	t	2026-03-26 16:35:55.492	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
5153dcae-ff49-4da2-a28b-edfe29d4c9bc	Rabri	2026-03-26 16:35:55.492	calcutta-main	\N	t	2026-03-26 16:35:55.492	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
527d8a95-3dee-4a7d-b26d-f662dd0b121f	Soan Papdi	2026-03-26 16:35:55.493	calcutta-main	\N	t	2026-03-26 16:35:55.493	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9999c195-23ca-4472-b709-7f9f279b2660	Aloo Gunda	2026-03-26 16:35:55.493	calcutta-main	\N	t	2026-03-26 16:35:55.493	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6fd4ea8c-310e-4d8c-a496-a5ad65605f39	Sev	2026-03-26 16:35:55.493	calcutta-main	\N	t	2026-03-26 16:35:55.493	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
b7e978c1-d1dc-4417-bbbf-64774991f620	Sitabhog	2026-03-26 16:35:55.494	calcutta-main	\N	t	2026-03-26 16:35:55.494	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f56314dd-8819-45b5-ab76-54ae0cb9383e	Malpua	2026-03-26 16:35:55.494	calcutta-main	\N	t	2026-03-26 16:35:55.494	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0d277a24-bb8d-4235-8488-d731cce10ae5	Akhrot	2026-03-26 16:35:55.495	calcutta-main	\N	t	2026-03-26 16:35:55.495	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a282a1fc-e573-4ebe-b3be-c1f0ad1b17cf	Kismis	2026-03-26 16:35:55.495	calcutta-main	\N	t	2026-03-26 16:35:55.495	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
73aa2c2a-03cf-4d84-b586-890586bb8089	Black Kismis	2026-03-26 16:35:55.496	calcutta-main	\N	t	2026-03-26 16:35:55.496	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a88a042d-5ebe-44ab-80e4-b5b3da50a83e	Khajur (Lulu)	2026-03-26 16:35:55.496	calcutta-main	\N	t	2026-03-26 16:35:55.496	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4e1fa108-0dda-4fc0-be09-567777ea751a	Khajur (Safawi)	2026-03-26 16:35:55.497	calcutta-main	\N	t	2026-03-26 16:35:55.497	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4cd98a5c-c9a6-49be-b824-1e89031a473e	Anjir	2026-03-26 16:35:55.497	calcutta-main	\N	t	2026-03-26 16:35:55.497	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e3cab25a-727d-4227-8e90-6ac07e353cb3	Mini Cone	2026-03-26 16:35:55.497	calcutta-main	\N	t	2026-03-26 16:35:55.497	86324965-02f9-454f-8ad7-c9180af65d3c	f
a2fccf46-c2b8-443f-a6a1-10001ec2433c	Cookie Disc Flingo Cone	2026-03-26 16:35:55.498	calcutta-main	\N	t	2026-03-26 16:35:55.498	86324965-02f9-454f-8ad7-c9180af65d3c	f
1a2f813a-0090-47a8-a0a3-e984405a52a2	Nutty Butterscotch Flingo Cone	2026-03-26 16:35:55.498	calcutta-main	\N	t	2026-03-26 16:35:55.498	86324965-02f9-454f-8ad7-c9180af65d3c	f
8039710d-b184-4ac8-ae10-6ddeb84b26e7	Choco Brownie Flingo Cone	2026-03-26 16:35:55.498	calcutta-main	\N	t	2026-03-26 16:35:55.498	86324965-02f9-454f-8ad7-c9180af65d3c	f
1e7c8e33-9fdb-4305-833c-ba67cff6f0f7	American Nuts Flingo Cone	2026-03-26 16:35:55.499	calcutta-main	\N	t	2026-03-26 16:35:55.499	86324965-02f9-454f-8ad7-c9180af65d3c	f
64664d68-be41-4041-99ca-ad150e309d38	Gajar Halwa	2026-03-26 16:35:55.5	calcutta-main	\N	t	2026-03-26 16:35:55.5	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cee39dd5-72c6-48ea-9ba4-6a109951f408	Til Laddu	2026-03-26 16:35:55.5	calcutta-main	\N	t	2026-03-26 16:35:55.5	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
83bd82af-fec1-455d-86ee-4b2ce9103944	Chaat Plate	2026-03-26 16:35:55.5	calcutta-main	\N	t	2026-03-26 16:35:55.5	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
134f0029-7918-4361-80a5-9b14d7e2efbb	Patisa	2026-03-26 16:35:55.501	calcutta-main	\N	t	2026-03-26 16:35:55.501	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d9d9ef2f-1d87-4e9a-be4d-26db37c99521	Haldiram Mixture	2026-03-26 16:35:55.501	calcutta-main	\N	t	2026-03-26 16:35:55.501	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
0eba5584-0812-4a5d-9822-9bdf731708ad	Badam	2026-03-26 16:35:55.502	calcutta-main	\N	t	2026-03-26 16:35:55.502	87524c0b-deea-4a33-95f7-216647a0ef8f	f
1eb72c70-20c8-421a-b296-7ad07cf65cd1	Malai Chamcham (Gur)	2026-03-26 16:35:55.502	calcutta-main	\N	t	2026-03-26 16:35:55.502	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f24279c9-66a4-4aab-ba0a-7f5e19fbdeea	Kalakand (Gur)	2026-03-26 16:35:55.503	calcutta-main	\N	t	2026-03-26 16:35:55.503	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ae3d7b1e-8f09-46c7-864a-016ffc21b7da	Rasgulla (Gur)	2026-03-26 16:35:55.503	calcutta-main	\N	t	2026-03-26 16:35:55.503	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cb7beb62-297e-4c23-881f-58d4715162d7	Kachori Chaat (Full Plate)	2026-03-26 16:35:55.503	calcutta-main	\N	t	2026-03-26 16:35:55.503	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
4ed03c40-5936-4130-a159-9a36a6f0b3ba	Dhokla Chaat (Full Plate)	2026-03-26 16:35:55.504	calcutta-main	\N	t	2026-03-26 16:35:55.504	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
545540b4-b85d-40fa-b545-cbac55a8f1f3	Samosa (Half Plate)	2026-03-26 16:35:55.504	calcutta-main	\N	t	2026-03-26 16:35:55.504	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
0ae27b61-ccde-45a8-9c06-0f91ef0f6977	Punjabi Masala Papad (Agrawal)	2026-03-26 16:35:55.505	calcutta-main	\N	t	2026-03-26 16:35:55.505	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3056c13d-b237-40b0-91b6-11964d0b9a76	Khatta Mitha Chana Papad	2026-03-26 16:35:55.505	calcutta-main	\N	t	2026-03-26 16:35:55.505	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0bf76ae0-73a4-4d0c-9f27-663d15a1ce50	Honey Muesli	2026-03-26 16:35:55.505	calcutta-main	\N	t	2026-03-26 16:35:55.505	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
aad10ad0-a0c0-4c97-ac3e-3eefdd567e09	Protein Bites	2026-03-26 16:35:55.506	calcutta-main	\N	t	2026-03-26 16:35:55.506	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
dd66d465-c933-42bb-9683-abb0c3e3f22e	Salted Muesli	2026-03-26 16:35:55.506	calcutta-main	\N	t	2026-03-26 16:35:55.506	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2362e01a-8a63-41a6-9cee-4300bba500eb	Faluda Mix Rose	2026-03-26 16:35:55.507	calcutta-main	\N	t	2026-03-26 16:35:55.507	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2f4222db-821a-4a71-bf8e-8d7ad9ea1743	Lal Mirch Lasun Paste	2026-03-26 16:35:55.507	calcutta-main	\N	t	2026-03-26 16:35:55.507	bf6479c6-f483-48d5-8d98-2e1346742072	f
d98e04cd-17c9-4b4d-97ad-248435dddeb1	Lemon Pickle (Nilon's)	2026-03-26 16:35:55.508	calcutta-main	\N	t	2026-03-26 16:35:55.508	bf6479c6-f483-48d5-8d98-2e1346742072	f
fc44a2db-1d64-426f-95a0-96a97c2cc251	Red Chilli Pickle (Nilon's)	2026-03-26 16:35:55.508	calcutta-main	\N	t	2026-03-26 16:35:55.508	bf6479c6-f483-48d5-8d98-2e1346742072	f
78c4d48d-e19e-4ceb-9979-e6f18ee6546b	Garlic Pickle (Nilon's)	2026-03-26 16:35:55.509	calcutta-main	\N	t	2026-03-26 16:35:55.509	bf6479c6-f483-48d5-8d98-2e1346742072	f
142988ec-a58c-4580-85e1-be42e1020a8b	Pepsi	2026-03-26 16:35:55.509	calcutta-main	\N	t	2026-03-26 16:35:55.509	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
83c60713-774b-464a-9594-b0de2a809225	Pepsi 2.	2026-03-26 16:35:55.51	calcutta-main	\N	t	2026-03-26 16:35:55.51	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b2efdb92-7d6b-4134-b579-0cc15a266b92	7UP	2026-03-26 16:35:55.51	calcutta-main	\N	t	2026-03-26 16:35:55.51	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c91ba766-4424-46e4-b77a-6690d2173465	7UP 2.	2026-03-26 16:35:55.51	calcutta-main	\N	t	2026-03-26 16:35:55.51	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a7addcba-0087-473c-8906-a623c30d8c49	Coffee Milkshake	2026-03-26 16:35:55.511	calcutta-main	\N	t	2026-03-26 16:35:55.511	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e7b34425-4b36-4a8a-9829-0bf3a3f6b7a2	Mini Butter Cookies	2026-03-26 16:35:55.511	calcutta-main	\N	t	2026-03-26 16:35:55.511	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
c9e05acf-b468-4960-9ef2-3b2135ea9eb8	Karachi Fruit Biscuit	2026-03-26 16:35:55.511	calcutta-main	\N	t	2026-03-26 16:35:55.511	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
1929a096-46d2-45b2-b1eb-d6a83823fda1	Mathari	2026-03-26 16:35:55.512	calcutta-main	\N	t	2026-03-26 16:35:55.512	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
70f2879c-0594-44ab-ab6e-8149b7489854	Kaju Cookies	2026-03-26 16:35:55.512	calcutta-main	\N	t	2026-03-26 16:35:55.512	87524c0b-deea-4a33-95f7-216647a0ef8f	f
c44a7b98-352a-4960-b5c0-7d9aa5b19381	Cake Rusk	2026-03-26 16:35:55.512	calcutta-main	\N	t	2026-03-26 16:35:55.512	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c477445e-fd29-47da-82a3-281b1afa4634	Elaichi Toast (Haldiram)	2026-03-26 16:35:55.513	calcutta-main	\N	t	2026-03-26 16:35:55.513	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
dc41edad-8e24-4804-be56-656b1708408b	Milk Toast (Haldiram)	2026-03-26 16:35:55.513	calcutta-main	\N	t	2026-03-26 16:35:55.513	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4bbfecee-eb6f-4249-ad3b-c745b2685f32	Pape Toast	2026-03-26 16:35:55.513	calcutta-main	\N	t	2026-03-26 16:35:55.513	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
04adc3de-3e92-416d-890c-667f1b2a1bb9	Dry Fruit Khazana Cup	2026-03-26 16:35:55.514	calcutta-main	\N	t	2026-03-26 16:35:55.514	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b6b6add3-8cd1-4be4-b01b-d5efe7e26b74	Rajwadi Kulfi Candy	2026-03-26 16:35:55.515	calcutta-main	\N	t	2026-03-26 16:35:55.515	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
654ef87b-0873-41eb-b340-439619145794	Butterscotch Jumbo Cup	2026-03-26 16:35:55.515	calcutta-main	\N	t	2026-03-26 16:35:55.515	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
fd74aa8c-b8e0-4974-b602-050721d183ce	American Nuts Jumbo Cup	2026-03-26 16:35:55.515	calcutta-main	\N	t	2026-03-26 16:35:55.515	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f8d8fbd8-ba97-4996-9904-9e7252b6be7d	Slice Cassata	2026-03-26 16:35:55.516	calcutta-main	\N	t	2026-03-26 16:35:55.516	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5f4ae2e8-6a39-4e3e-8fc4-28bc21a44da7	Vanilla Ice Cream	2026-03-26 16:35:55.517	calcutta-main	\N	t	2026-03-26 16:35:55.517	86324965-02f9-454f-8ad7-c9180af65d3c	f
55ec2843-62bd-40bf-a52f-09d486e64a23	Hing Peda (Shadani)	2026-03-26 16:35:55.517	calcutta-main	\N	t	2026-03-26 16:35:55.517	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c07e6ec6-76d7-4964-9d2c-d9450d3443a7	Paan Candy (Shadani)	2026-03-26 16:35:55.517	calcutta-main	\N	t	2026-03-26 16:35:55.517	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
5a5a3104-b7f8-4401-aef1-a8c4c4296c67	Sweet Amla (Shadani)	2026-03-26 16:35:55.518	calcutta-main	\N	t	2026-03-26 16:35:55.518	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0b8b57b8-cfa4-4008-a3ea-bd9b01c28b54	Sahi Mix Saunf (Shadani)	2026-03-26 16:35:55.518	calcutta-main	\N	t	2026-03-26 16:35:55.518	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8c43f74e-c60a-4305-b064-f0302c0d7949	Chatpata Amla (Shadani)	2026-03-26 16:35:55.519	calcutta-main	\N	t	2026-03-26 16:35:55.519	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8e7b5dff-c523-421c-add5-6382a8208e5b	Murra	2026-03-26 16:35:55.519	calcutta-main	\N	t	2026-03-26 16:35:55.519	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2cc284a3-5fda-44cb-a783-783972b2a002	Jhalmuri (Bikaji)	2026-03-26 16:35:55.519	calcutta-main	\N	t	2026-03-26 16:35:55.519	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1be6937d-af4b-4933-b127-c9618e19650c	Tasty Nuts (Haldiram)	2026-03-26 16:35:55.519	calcutta-main	\N	t	2026-03-26 16:35:55.519	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c66b4bb5-4e66-4e59-9085-7c0fa0c6e46e	Dry Fruits Mix	2026-03-26 16:35:55.52	calcutta-main	\N	t	2026-03-26 16:35:55.52	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
49631276-ccf3-4066-ae59-5c72dfdbee48	Navratan Mix (Haldiram)	2026-03-26 16:35:55.52	calcutta-main	\N	t	2026-03-26 16:35:55.52	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
720292ec-a010-45ad-bd6c-94045b91e988	Nimboo Pudina Chana (Jobsons)	2026-03-26 16:35:55.521	calcutta-main	\N	t	2026-03-26 16:35:55.521	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
38c85eb3-9bb1-4350-ac22-cb602b0a8c54	Roasted Peanuts (Jobsons)	2026-03-26 16:35:55.521	calcutta-main	\N	t	2026-03-26 16:35:55.521	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b78ac960-9387-4977-80a1-fff399ee7ba5	Kaju Katli	2026-03-26 16:35:55.521	calcutta-main	\N	t	2026-03-26 16:35:55.521	87524c0b-deea-4a33-95f7-216647a0ef8f	f
b99c399d-623f-41e9-af94-0956451e0590	Sada Mixture	2026-03-26 16:35:55.522	calcutta-main	\N	t	2026-03-26 16:35:55.522	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
1928bb39-5fdd-428f-826a-4dff1ddecd68	Kaju Roll	2026-03-26 16:35:55.522	calcutta-main	\N	t	2026-03-26 16:35:55.522	87524c0b-deea-4a33-95f7-216647a0ef8f	f
4daae8ac-4120-4cb8-9126-93231804dd2d	Pista Almond Sweet	2026-03-26 16:35:55.522	calcutta-main	\N	t	2026-03-26 16:35:55.522	87524c0b-deea-4a33-95f7-216647a0ef8f	f
d48b516b-5ca6-4184-80ca-c8241c783e88	Lasun Sev	2026-03-26 16:35:55.523	calcutta-main	\N	t	2026-03-26 16:35:55.523	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
cc91ba54-ee6f-4a1b-9343-aac8ff19685f	Mota Sev	2026-03-26 16:35:55.523	calcutta-main	\N	t	2026-03-26 16:35:55.523	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
922180dd-ea04-4978-adde-968e2b08f11c	Real Apple Juice	2026-03-26 16:35:55.523	calcutta-main	\N	t	2026-03-26 16:35:55.523	f6460f7b-173d-426b-93d8-2b3587e7147d	f
71e50312-0920-42b6-b5c5-daf19099b161	Real Litchi Juice	2026-03-26 16:35:55.524	calcutta-main	\N	t	2026-03-26 16:35:55.524	f6460f7b-173d-426b-93d8-2b3587e7147d	f
09e78e45-2755-47dc-9bf2-4e061717efcc	Real Mixed Fruit Juice	2026-03-26 16:35:55.524	calcutta-main	\N	t	2026-03-26 16:35:55.524	f6460f7b-173d-426b-93d8-2b3587e7147d	f
561b0309-dd96-45b0-8ada-147d218adba3	Real Guava Juice	2026-03-26 16:35:55.525	calcutta-main	\N	t	2026-03-26 16:35:55.525	f6460f7b-173d-426b-93d8-2b3587e7147d	f
e8fbe411-f472-4b7c-ba1c-df2dfc36bf7b	Tropicana Mixed Fruit Juice	2026-03-26 16:35:55.525	calcutta-main	\N	t	2026-03-26 16:35:55.525	f6460f7b-173d-426b-93d8-2b3587e7147d	f
233fe744-cdcd-4fec-a95a-8c13225b4787	Kurkure Masala Munch	2026-03-26 16:35:55.526	calcutta-main	\N	t	2026-03-26 16:35:55.526	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
494de6c8-a029-4946-8529-1bb1fae3b45a	Kurkure Chilli Chatka	2026-03-26 16:35:55.526	calcutta-main	\N	t	2026-03-26 16:35:55.526	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1af6ff1a-61df-4713-9549-cc14370423c4	Lays Cream & Onion	2026-03-26 16:35:55.526	calcutta-main	\N	t	2026-03-26 16:35:55.526	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b36b7c09-ed40-4257-bbf1-4490c4f51d54	Lays Spanish Tomato Tango	2026-03-26 16:35:55.527	calcutta-main	\N	t	2026-03-26 16:35:55.527	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
47b0240f-2db3-4421-8407-8fd0af8ee7b8	Mirinda 2.	2026-03-26 16:35:55.527	calcutta-main	\N	t	2026-03-26 16:35:55.527	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d29942ff-195e-445b-9dd3-42d68aabc730	Nimbooz	2026-03-26 16:35:55.527	calcutta-main	\N	t	2026-03-26 16:35:55.527	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e4f1c42e-3f04-4adb-a822-177b52d5bc7f	Red Bull	2026-03-26 16:35:55.527	calcutta-main	\N	t	2026-03-26 16:35:55.527	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4fe18535-902e-4e32-bfa3-29ae844ed572	Hell Energy Drink	2026-03-26 16:35:55.528	calcutta-main	\N	t	2026-03-26 16:35:55.528	f6460f7b-173d-426b-93d8-2b3587e7147d	f
708ef27f-127f-45bc-a7ea-12ab81ce6206	Coconut Water	2026-03-26 16:35:55.528	calcutta-main	\N	t	2026-03-26 16:35:55.528	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
dc22a065-2a04-4a11-9d35-dfa43a5d7504	Bisleri	2026-03-26 16:35:55.528	calcutta-main	\N	t	2026-03-26 16:35:55.528	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b0cd4556-3b57-4b28-9d24-3c0125b0a21b	Misti Dahi (Small)	2026-03-26 16:35:55.529	calcutta-main	\N	t	2026-03-26 16:35:55.529	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0dd1cba8-f4b3-4bc6-bd3f-1ee2b56fc240	Misti Dahi (Big)	2026-03-26 16:35:55.529	calcutta-main	\N	t	2026-03-26 16:35:55.529	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
24f96488-ab4e-412e-a784-b673b87068ae	Rasmalai (Cup)	2026-03-26 16:35:55.53	calcutta-main	\N	t	2026-03-26 16:35:55.53	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
555e22e9-20d9-4f04-8373-ce823d6ee5a2	Rajbhog	2026-03-26 16:35:55.53	calcutta-main	\N	t	2026-03-26 16:35:55.53	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
54422095-39f1-4db6-8193-649db38f4cb1	Rasgulla	2026-03-26 16:35:55.53	calcutta-main	\N	t	2026-03-26 16:35:55.53	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9602cc4e-83b7-4fed-8ca0-f72fcbde9ba3	Kacha Golla (Gur)	2026-03-26 16:35:55.53	calcutta-main	\N	t	2026-03-26 16:35:55.53	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8d81988b-62da-4f56-8293-8be97b6e14bb	Sugar Free Sweet	2026-03-26 16:35:55.531	calcutta-main	\N	t	2026-03-26 16:35:55.531	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7957c8ed-7315-491c-b7fb-657acfaa76ae	Bundi (Ghee)	2026-03-26 16:35:55.531	calcutta-main	\N	t	2026-03-26 16:35:55.531	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cbe137a6-76e9-42c3-badc-37618434d2d6	Pinni Laddu	2026-03-26 16:35:55.531	calcutta-main	\N	t	2026-03-26 16:35:55.531	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d5692d07-13a2-4f3a-9a7a-bc12433f5940	Gond Laddu	2026-03-26 16:35:55.531	calcutta-main	\N	t	2026-03-26 16:35:55.531	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
620de461-5368-46fd-beb2-d836b40700f0	Sandesh	2026-03-26 16:35:55.532	calcutta-main	\N	t	2026-03-26 16:35:55.532	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
91317605-4e58-47c6-8f4d-6006a2bb41f1	Sandesh (Gur)	2026-03-26 16:35:55.532	calcutta-main	\N	t	2026-03-26 16:35:55.532	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b68748e8-eb36-4c57-af4a-d71043e1f3f3	Peda	2026-03-26 16:35:55.533	calcutta-main	\N	t	2026-03-26 16:35:55.533	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
fb4e091e-2520-4f43-b3b5-8776aa6c00f3	Nariyal Barfi	2026-03-26 16:35:55.533	calcutta-main	\N	t	2026-03-26 16:35:55.533	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2024bef9-8ca2-4f27-aad3-a749d37259d7	Nariyal Peda	2026-03-26 16:35:55.534	calcutta-main	\N	t	2026-03-26 16:35:55.534	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
76dcac8d-ecd4-45e9-9dcf-2cd27cb1e0f0	Gujiya	2026-03-26 16:35:55.534	calcutta-main	\N	t	2026-03-26 16:35:55.534	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
388cb7f1-0470-44fd-92eb-bbf99191b202	Dry Gujiya	2026-03-26 16:35:55.534	calcutta-main	\N	t	2026-03-26 16:35:55.534	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ae1036f1-5f2c-4907-b8ea-a6b6e44bc079	Gulab Jamun	2026-03-26 16:35:55.535	calcutta-main	\N	t	2026-03-26 16:35:55.535	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2cd8822f-9674-46c9-b77d-8a4d54a054ff	Kala Jamun	2026-03-26 16:35:55.535	calcutta-main	\N	t	2026-03-26 16:35:55.535	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
396f4650-b143-4c7e-9a4b-bc1df4d46632	Roasted Badam	2026-03-26 16:35:55.535	calcutta-main	\N	t	2026-03-26 16:35:55.535	87524c0b-deea-4a33-95f7-216647a0ef8f	f
e8724e2c-18f2-47f3-b4ef-1ee93d91aa09	Mix Nuts	2026-03-26 16:35:55.535	calcutta-main	\N	t	2026-03-26 16:35:55.535	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b2a4932f-70bd-4c57-9508-5af07dfceeac	Khajur (Sharbat)	2026-03-26 16:35:55.536	calcutta-main	\N	t	2026-03-26 16:35:55.536	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
129da097-155f-4efa-9f31-f5e9bfe0e3ad	Roasted Pista	2026-03-26 16:35:55.536	calcutta-main	\N	t	2026-03-26 16:35:55.536	87524c0b-deea-4a33-95f7-216647a0ef8f	f
0d2f82bc-4f6b-44ae-979f-c1549fd8a355	Roasted Kaju	2026-03-26 16:35:55.536	calcutta-main	\N	t	2026-03-26 16:35:55.536	87524c0b-deea-4a33-95f7-216647a0ef8f	f
7afc53c4-c091-469a-b2fa-35ab2ffa2e88	Sada Kaju	2026-03-26 16:35:55.537	calcutta-main	\N	t	2026-03-26 16:35:55.537	87524c0b-deea-4a33-95f7-216647a0ef8f	f
a9314c74-9fc1-4e8d-ac46-86f0c26659b6	Chocolate Chips Ice Cream	2026-03-26 16:35:55.537	calcutta-main	\N	t	2026-03-26 16:35:55.537	86324965-02f9-454f-8ad7-c9180af65d3c	f
0e33218f-a2c5-421f-9d2f-640274cad536	Pista Cone	2026-03-26 16:35:55.538	calcutta-main	\N	t	2026-03-26 16:35:55.538	86324965-02f9-454f-8ad7-c9180af65d3c	f
066279ca-23cc-4f46-83c0-68196c4df263	Butterscotch Cone	2026-03-26 16:35:55.538	calcutta-main	\N	t	2026-03-26 16:35:55.538	86324965-02f9-454f-8ad7-c9180af65d3c	f
d1fda3e7-e8ef-4d81-8952-f4e2675a31cb	Amul Fresh Cream	2026-03-26 16:35:55.538	calcutta-main	\N	t	2026-03-26 16:35:55.538	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a4682506-d379-47fe-8bcf-1e8b88c67e26	Mini Bakharwadi	2026-03-26 16:35:55.538	calcutta-main	\N	t	2026-03-26 16:35:55.538	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
42254e2e-96b7-469b-9d34-ca7056cb57aa	Mango Delight	2026-03-26 16:35:55.539	calcutta-main	\N	t	2026-03-26 16:35:55.539	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9f7200e2-9c63-432b-9d41-b4c307d27d97	Mathri	2026-03-26 16:35:55.539	calcutta-main	\N	t	2026-03-26 16:35:55.539	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8ac6ed8a-287d-49ec-97b7-30087f4a9372	Jeera Mathri	2026-03-26 16:35:55.539	calcutta-main	\N	t	2026-03-26 16:35:55.539	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a545ac54-1c95-48ad-b873-d86d75f6095c	Methi Mathri	2026-03-26 16:35:55.54	calcutta-main	\N	t	2026-03-26 16:35:55.54	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1911a9e4-7dfd-4baa-b30d-31392814df4e	Lasun Mathri	2026-03-26 16:35:55.54	calcutta-main	\N	t	2026-03-26 16:35:55.54	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d242ae6d-0ce3-43f0-82b2-29f79adabedf	Bhujia Sev (Haldiram)	2026-03-26 16:35:55.541	calcutta-main	\N	t	2026-03-26 16:35:55.541	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
f4635acd-813e-4f7d-9b6a-de2cddd09d72	Chana Chur (Bikaji)	2026-03-26 16:35:55.541	calcutta-main	\N	t	2026-03-26 16:35:55.541	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5a082f0e-9397-47c4-9160-3fdb96497444	All in One Namkeen (Haldiram)	2026-03-26 16:35:55.541	calcutta-main	\N	t	2026-03-26 16:35:55.541	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
cdd42c20-8a4c-44d8-bec1-ca4a2aa4020c	Samosa	2026-03-26 16:35:55.542	calcutta-main	\N	t	2026-03-26 16:35:55.542	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
e02d0333-aeda-4777-8ac7-5ff826b2a311	Crunchy Butterscotch Ice Cream Tub	2026-03-26 16:35:55.542	calcutta-main	\N	t	2026-03-26 16:35:55.542	86324965-02f9-454f-8ad7-c9180af65d3c	f
7af6ff71-4564-48e9-b22c-4d32ec23039f	Dark Chocolate Ice Cream Tub	2026-03-26 16:35:55.542	calcutta-main	\N	t	2026-03-26 16:35:55.542	86324965-02f9-454f-8ad7-c9180af65d3c	f
4b0cfa82-eb2f-44df-ae95-b5a04ec80745	Belgian Chocolate Ice Cream Tub	2026-03-26 16:35:55.543	calcutta-main	\N	t	2026-03-26 16:35:55.543	86324965-02f9-454f-8ad7-c9180af65d3c	f
8fd2e15f-c6af-4b18-82b4-258f4cd1290b	Kesar Rasmalai Ice Cream Tub	2026-03-26 16:35:55.543	calcutta-main	\N	t	2026-03-26 16:35:55.543	86324965-02f9-454f-8ad7-c9180af65d3c	f
8987a97e-bd27-45c1-abd1-f543f1501744	Classic Malai Ice Cream Tub	2026-03-26 16:35:55.543	calcutta-main	\N	t	2026-03-26 16:35:55.543	86324965-02f9-454f-8ad7-c9180af65d3c	f
357cd02d-3082-4fb3-a942-0a1770b5550c	Falooda Ice Cream Tub	2026-03-26 16:35:55.544	calcutta-main	\N	t	2026-03-26 16:35:55.544	86324965-02f9-454f-8ad7-c9180af65d3c	f
dc0dd1f5-9c99-4c22-b13b-83c73aa49b3c	Real Cranberry Juice	2026-03-26 16:35:55.544	calcutta-main	\N	t	2026-03-26 16:35:55.544	f6460f7b-173d-426b-93d8-2b3587e7147d	f
706f40de-0dcf-412e-85fd-45685211e828	Real Pomegranate Juice	2026-03-26 16:35:55.544	calcutta-main	\N	t	2026-03-26 16:35:55.544	f6460f7b-173d-426b-93d8-2b3587e7147d	f
32cc2f54-74d0-4599-bb5a-3e2d48265daf	Real Pineapple Juice	2026-03-26 16:35:55.545	calcutta-main	\N	t	2026-03-26 16:35:55.545	f6460f7b-173d-426b-93d8-2b3587e7147d	f
950e4fc5-22ec-4079-b0cc-9a84c5513371	Real Mosambi Juice	2026-03-26 16:35:55.545	calcutta-main	\N	t	2026-03-26 16:35:55.545	f6460f7b-173d-426b-93d8-2b3587e7147d	f
f8d5e220-c45e-4e48-8918-2c54663271a3	Khakhra (Kanidha)	2026-03-26 16:35:55.545	calcutta-main	\N	t	2026-03-26 16:35:55.545	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ca4ba551-be2f-435f-9888-942e021c9fe7	Sada Papad	2026-03-26 16:35:55.545	calcutta-main	\N	t	2026-03-26 16:35:55.545	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
08ddf206-150b-489e-b3b1-aaa3d1740410	Milk Cake (Lamba)	2026-03-26 16:35:55.546	calcutta-main	\N	t	2026-03-26 16:35:55.546	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bac36414-d3a7-47c9-a577-f158b76db8ec	Doda Barfi	2026-03-26 16:35:55.547	calcutta-main	\N	t	2026-03-26 16:35:55.547	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
38dd4996-debf-4c86-9233-c5815cf0014c	Anjir Roll	2026-03-26 16:35:55.547	calcutta-main	\N	t	2026-03-26 16:35:55.547	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
529a3b0c-7f70-49af-865b-753f71df7fd7	Milk Cake (Box)	2026-03-26 16:35:55.547	calcutta-main	\N	t	2026-03-26 16:35:55.547	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d78521b2-b5c8-477c-9ebd-075e16741e9a	Kheer Kadam	2026-03-26 16:35:55.548	calcutta-main	\N	t	2026-03-26 16:35:55.548	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3999f8f6-6e2a-44c2-b63c-ef15df19c918	Malai Barfi	2026-03-26 16:35:55.548	calcutta-main	\N	t	2026-03-26 16:35:55.548	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
316418cf-9cf9-4542-b56a-3591be03abfd	Sprite	2026-03-26 16:35:55.548	calcutta-main	\N	t	2026-03-26 16:35:55.548	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
73a3c433-7bbc-43ca-b979-386fa177834b	Thums Up  Can	2026-03-26 16:35:55.549	calcutta-main	\N	t	2026-03-26 16:35:55.549	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7b1c1768-0fb2-4446-9daf-7912707eb915	Thums Up	2026-03-26 16:35:55.549	calcutta-main	\N	t	2026-03-26 16:35:55.549	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
81f13dc9-caad-438e-9443-216905889000	Petha (Haldiram)	2026-03-26 16:35:55.55	calcutta-main	\N	t	2026-03-26 16:35:55.55	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
94b7f95b-65d8-4bfa-b2b0-f79fd0941725	Chikki	2026-03-26 16:35:55.55	calcutta-main	\N	t	2026-03-26 16:35:55.55	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
221e2930-bb3b-4666-8b99-d2222cfdd593	Red Chilli (DLS)	2026-03-26 16:35:55.55	calcutta-main	\N	t	2026-03-26 16:35:55.55	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ef6228ce-cda1-4ec5-aeac-2477ec9d8960	Green Chilli (DLS)	2026-03-26 16:35:55.551	calcutta-main	\N	t	2026-03-26 16:35:55.551	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
603224cd-cddf-4e37-bd51-e99e0371eec2	Kaju	2026-03-26 16:35:55.551	calcutta-main	\N	t	2026-03-26 16:35:55.551	87524c0b-deea-4a33-95f7-216647a0ef8f	f
56676f79-e5f6-48e8-8032-4215ba501c3b	Gujiya (Piece)	2026-03-26 16:35:55.551	calcutta-main	\N	t	2026-03-26 16:35:55.551	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
96c11e3d-4d6c-47cd-8cbf-8ccc466fc0f0	Khoya	2026-03-26 16:35:55.552	calcutta-main	\N	t	2026-03-26 16:35:55.552	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
244fc0a9-0666-4655-a9c7-7a746918c2a2	Cutlet Samosa	2026-03-26 16:35:55.552	calcutta-main	\N	t	2026-03-26 16:35:55.552	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
20ae8f88-6606-4f9c-9619-47cef7c4f807	Green Peas	2026-03-26 16:35:55.552	calcutta-main	\N	t	2026-03-26 16:35:55.552	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5296381e-20ca-4975-8c14-cb2a7d47b817	Thepla	2026-03-26 16:35:55.553	calcutta-main	\N	t	2026-03-26 16:35:55.553	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
557a1278-09e5-42e5-b516-d2c068186371	Badam Cookies	2026-03-26 16:35:55.553	calcutta-main	\N	t	2026-03-26 16:35:55.553	87524c0b-deea-4a33-95f7-216647a0ef8f	f
2898cfd6-ceb7-467c-9005-edbe0c696fa7	Butter Cookies	2026-03-26 16:35:55.553	calcutta-main	\N	t	2026-03-26 16:35:55.553	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
171bbc46-ece3-45ae-9812-49c5845beb46	Coconut Jaggery Cookies	2026-03-26 16:35:55.553	calcutta-main	\N	t	2026-03-26 16:35:55.553	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
9856e762-5bdc-45ab-8ade-8d9b9a6d4ee7	Ajwain Cookies	2026-03-26 16:35:55.554	calcutta-main	\N	t	2026-03-26 16:35:55.554	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
d0457ca3-d43f-4b2e-9a87-20ec32918083	Litchi Drink	2026-03-26 16:35:55.554	calcutta-main	\N	t	2026-03-26 16:35:55.554	f6460f7b-173d-426b-93d8-2b3587e7147d	f
a35f2f7f-5ae7-4d18-93c9-2503b029537c	Cream Bell Coffee	2026-03-26 16:35:55.554	calcutta-main	\N	t	2026-03-26 16:35:55.554	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b3452ea8-b066-4b02-a229-e095963144ca	Cream Bell Kesar Badam	2026-03-26 16:35:55.555	calcutta-main	\N	t	2026-03-26 16:35:55.555	87524c0b-deea-4a33-95f7-216647a0ef8f	f
8d1f96e4-59a1-498c-b35d-ee469b9b3be5	Cream Bell Chocolate	2026-03-26 16:35:55.555	calcutta-main	\N	t	2026-03-26 16:35:55.555	f6460f7b-173d-426b-93d8-2b3587e7147d	f
b878b177-c4a2-46da-a561-e2273a99c840	Mirinda	2026-03-26 16:35:55.555	calcutta-main	\N	t	2026-03-26 16:35:55.555	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bef7d12a-2a47-40a4-8c15-c25d9098c605	Coca Cola	2026-03-26 16:35:55.555	calcutta-main	\N	t	2026-03-26 16:35:55.555	f6460f7b-173d-426b-93d8-2b3587e7147d	f
234bdee7-6ef8-4ff7-aebb-36b81e203b60	Goli Soda	2026-03-26 16:35:55.556	calcutta-main	\N	t	2026-03-26 16:35:55.556	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1d5bf0fd-7db5-4777-a3c3-26bb4474e840	Bisk Farm Top Crunch Biscuit	2026-03-26 16:35:55.556	calcutta-main	\N	t	2026-03-26 16:35:55.556	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
da45849e-2608-45f3-bd4c-11a9c7322f98	Bisk Farm Googly Bite Biscuit	2026-03-26 16:35:55.558	calcutta-main	\N	t	2026-03-26 16:35:55.558	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
e5d212c6-397d-451c-8a3c-0922c8435193	Mountain Dew 1.	2026-03-26 16:35:55.559	calcutta-main	\N	t	2026-03-26 16:35:55.559	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8351aa94-6e48-4107-b1bf-fe08c30a843b	Lite Chiwda	2026-03-26 16:35:55.559	calcutta-main	\N	t	2026-03-26 16:35:55.559	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e5f83d6f-92e5-427a-a5aa-5bfecd8dd59e	Modak	2026-03-26 16:35:55.559	calcutta-main	\N	t	2026-03-26 16:35:55.559	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7a4a86a1-2b7a-4e9d-88f6-113f35467a08	Besan Modak	2026-03-26 16:35:55.559	calcutta-main	\N	t	2026-03-26 16:35:55.559	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e289d132-617b-44b4-8468-4ee8ab0040b4	Bundi Modak (Ghee)	2026-03-26 16:35:55.56	calcutta-main	\N	t	2026-03-26 16:35:55.56	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
16fe8d8e-7408-41cf-9b82-b059573ce1d1	Khasta	2026-03-26 16:35:55.56	calcutta-main	\N	t	2026-03-26 16:35:55.56	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
932cb12f-0cb9-4b6b-8662-c10f203828cf	Barik Saloni	2026-03-26 16:35:55.56	calcutta-main	\N	t	2026-03-26 16:35:55.56	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
14e2d851-6b7b-4337-ac1f-ad6cec44ff28	Palak Mathri	2026-03-26 16:35:55.561	calcutta-main	\N	t	2026-03-26 16:35:55.561	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
dcde687c-d40d-4fa8-a307-07de98ec70f1	Saloni	2026-03-26 16:35:55.561	calcutta-main	\N	t	2026-03-26 16:35:55.561	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cbdfc666-7ac3-4658-89c7-3d436b2a37df	Rooh Afza Sharbat	2026-03-26 16:35:55.561	calcutta-main	\N	t	2026-03-26 16:35:55.561	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9e2ab3f1-7b36-4195-9aa6-c8b8501cba18	Mala's Orange Crush	2026-03-26 16:35:55.562	calcutta-main	\N	t	2026-03-26 16:35:55.562	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
153ae4f7-5691-45ca-ad58-391a2fb4a983	Mala's Banana Crush	2026-03-26 16:35:55.562	calcutta-main	\N	t	2026-03-26 16:35:55.562	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
dd1cb594-1347-4439-a518-6446b8e77197	Mala's Watermelon Syrup	2026-03-26 16:35:55.562	calcutta-main	\N	t	2026-03-26 16:35:55.562	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
baefb42b-90ee-49c1-a07b-ab62cdf37549	Mala's Lime Cordial	2026-03-26 16:35:55.563	calcutta-main	\N	t	2026-03-26 16:35:55.563	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
210f8a41-7e18-4853-b40c-7b78a0cceb76	Real Orange Juice	2026-03-26 16:35:55.563	calcutta-main	\N	t	2026-03-26 16:35:55.563	f6460f7b-173d-426b-93d8-2b3587e7147d	f
3a4270d6-ce98-474d-84fc-5a5ae3ac51e9	Kacha Golla	2026-03-26 16:35:55.563	calcutta-main	\N	t	2026-03-26 16:35:55.563	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
66a71ee0-f4d3-47f9-8ebc-47881315a1b7	Nikuti	2026-03-26 16:35:55.563	calcutta-main	\N	t	2026-03-26 16:35:55.563	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cb81243f-3bd4-42cc-a268-028470faf401	Pantua	2026-03-26 16:35:55.564	calcutta-main	\N	t	2026-03-26 16:35:55.564	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b3fd20f0-a8c9-431b-b48c-3e428b6c2d52	Paneer	2026-03-26 16:35:55.564	calcutta-main	\N	t	2026-03-26 16:35:55.564	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
97ce127a-b27b-4d97-aca8-7fbc729bd990	Curd (Dahi)	2026-03-26 16:35:55.564	calcutta-main	\N	t	2026-03-26 16:35:55.564	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3741fc6d-20bd-4057-9bec-2e5c82d406c5	Misti Dahi	2026-03-26 16:35:55.565	calcutta-main	\N	t	2026-03-26 16:35:55.565	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a2071d27-58c0-4998-9366-2516d714423c	Cutlet	2026-03-26 16:35:55.565	calcutta-main	\N	t	2026-03-26 16:35:55.565	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f34a0753-f4ff-4e3c-ae1e-7a4ba0a95522	Kesar Lassi (Glass)	2026-03-26 16:35:55.565	calcutta-main	\N	t	2026-03-26 16:35:55.565	f6460f7b-173d-426b-93d8-2b3587e7147d	f
ead4efe3-2a0e-470d-a2d4-ef0c906f1c39	KitKat Small	2026-03-26 16:35:55.566	calcutta-main	\N	t	2026-03-26 16:35:55.566	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bfdb3186-6003-452c-8d82-88bd29454ffd	KitKat Medium	2026-03-26 16:35:55.566	calcutta-main	\N	t	2026-03-26 16:35:55.566	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
aab440e8-9276-4562-98e8-a6b02dcde740	Frozen Green Peas	2026-03-26 16:35:55.566	calcutta-main	\N	t	2026-03-26 16:35:55.566	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
45ada657-5576-46d7-aa41-a50bbd9e4f38	Butterscotch Ice Cream Cup	2026-03-26 16:35:55.567	calcutta-main	\N	t	2026-03-26 16:35:55.567	86324965-02f9-454f-8ad7-c9180af65d3c	f
f2c51ed3-d93d-43e8-a5c3-b39605224510	Strawberry Ice Cream Cup	2026-03-26 16:35:55.567	calcutta-main	\N	t	2026-03-26 16:35:55.567	86324965-02f9-454f-8ad7-c9180af65d3c	f
58bdfe21-abae-468f-a087-2aa839674c4f	American Nuts Ice Cream Cup	2026-03-26 16:35:55.567	calcutta-main	\N	t	2026-03-26 16:35:55.567	86324965-02f9-454f-8ad7-c9180af65d3c	f
5249cfb3-e0f4-4f59-a25b-753e4700d004	Choco Brownie Ice Cream Cup	2026-03-26 16:35:55.568	calcutta-main	\N	t	2026-03-26 16:35:55.568	86324965-02f9-454f-8ad7-c9180af65d3c	f
71518324-2fc5-44e6-be60-1b568e606e0f	Vanilla Brownie Ice Cream Tub	2026-03-26 16:35:55.568	calcutta-main	\N	t	2026-03-26 16:35:55.568	86324965-02f9-454f-8ad7-c9180af65d3c	f
e92df644-cfdc-4665-a6a8-36e0e13bf3d9	American Nuts Ice Cream Tub	2026-03-26 16:35:55.568	calcutta-main	\N	t	2026-03-26 16:35:55.568	86324965-02f9-454f-8ad7-c9180af65d3c	f
acb2a530-d112-4725-abdf-8551d71aef6b	Amul Masti Lassi	2026-03-26 16:35:55.568	calcutta-main	\N	t	2026-03-26 16:35:55.568	f6460f7b-173d-426b-93d8-2b3587e7147d	f
f612ee4b-be56-4e81-b2d5-e25eaa2e5745	Heylo Butter Cookies	2026-03-26 16:35:55.569	calcutta-main	\N	t	2026-03-26 16:35:55.569	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
e0a3cb3f-27a3-469e-87eb-873837635be9	Paper Plate Small	2026-03-26 16:35:55.569	calcutta-main	\N	t	2026-03-26 16:35:55.569	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5a6b7eec-27da-4d05-b785-91ec41968184	Paper Plate Large	2026-03-26 16:35:55.57	calcutta-main	\N	t	2026-03-26 16:35:55.57	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f32434d4-3308-451d-a1c4-a6522656f629	Paper Glass	2026-03-26 16:35:55.57	calcutta-main	\N	t	2026-03-26 16:35:55.57	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d919e46b-d56d-4988-9985-f8149eda9e6a	Plastic Spoon	2026-03-26 16:35:55.57	calcutta-main	\N	t	2026-03-26 16:35:55.57	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7f2d6ee4-8654-4af0-a12a-659276354511	Sting Energy Drink	2026-03-26 16:35:55.57	calcutta-main	\N	t	2026-03-26 16:35:55.57	f6460f7b-173d-426b-93d8-2b3587e7147d	f
edfa152c-64bc-4a54-a97e-130a9a9cd635	Limca	2026-03-26 16:35:55.571	calcutta-main	\N	t	2026-03-26 16:35:55.571	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e7049955-f4fd-4ce9-be07-48438c6b2515	Kinley Soda	2026-03-26 16:35:55.571	calcutta-main	\N	t	2026-03-26 16:35:55.571	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bc7c3288-8da0-4d5e-8052-ab86bcc1d857	Mewa Bites	2026-03-26 16:35:55.571	calcutta-main	\N	t	2026-03-26 16:35:55.571	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d9ef4f91-5b28-4020-a2fa-398e8463f885	Balushahi	2026-03-26 16:35:55.572	calcutta-main	\N	t	2026-03-26 16:35:55.572	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bea78743-f406-4271-80ec-faa88ed84b16	Sandwich Malai Chap	2026-03-26 16:35:55.572	calcutta-main	\N	t	2026-03-26 16:35:55.572	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
accfad18-ed8b-4d88-aca0-ab0677bb95d0	Bisleri  (Pack)	2026-03-26 16:35:55.572	calcutta-main	\N	t	2026-03-26 16:35:55.572	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bd6dcb54-95f1-4b0e-8fb5-89fa23b890db	Khoya Jalebi	2026-03-26 16:35:55.573	calcutta-main	\N	t	2026-03-26 16:35:55.573	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7528e0ea-974a-423f-9cb7-7e78dc3e9843	Malai Chap	2026-03-26 16:35:55.573	calcutta-main	\N	t	2026-03-26 16:35:55.573	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c1724d04-53e0-4827-bb49-210a50b4e081	Malai Toast	2026-03-26 16:35:55.573	calcutta-main	\N	t	2026-03-26 16:35:55.573	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3c30ae3a-6aec-4767-9c9e-2acd00d81e7c	Malai Chamcham	2026-03-26 16:35:55.573	calcutta-main	\N	t	2026-03-26 16:35:55.573	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
54429d5c-2125-4611-878d-3635a99ad7a6	Chamcham	2026-03-26 16:35:55.574	calcutta-main	\N	t	2026-03-26 16:35:55.574	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c5b97ac5-f2ad-4ca4-b8e0-22e16aaf13a2	Rasbhari	2026-03-26 16:35:55.574	calcutta-main	\N	t	2026-03-26 16:35:55.574	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4dcf1f3b-9dc7-4226-b235-dc815e6d988c	Green Chilli Pickle	2026-03-26 16:35:55.574	calcutta-main	\N	t	2026-03-26 16:35:55.574	bf6479c6-f483-48d5-8d98-2e1346742072	f
0929dae8-aa9a-4b53-8a35-c6b64c837180	Mango Pickle	2026-03-26 16:35:55.574	calcutta-main	\N	t	2026-03-26 16:35:55.574	bf6479c6-f483-48d5-8d98-2e1346742072	f
76a77a4c-2c22-4e12-9179-e30a1f0115ca	Lemon Pickle	2026-03-26 16:35:55.575	calcutta-main	\N	t	2026-03-26 16:35:55.575	bf6479c6-f483-48d5-8d98-2e1346742072	f
14aa7496-4817-4d57-abfb-921d992eb4d6	Sweet Lemon Pickle	2026-03-26 16:35:55.575	calcutta-main	\N	t	2026-03-26 16:35:55.575	bf6479c6-f483-48d5-8d98-2e1346742072	f
2d27fda8-2206-463e-8331-abc17efbe400	Tomato Ketchup 1.	2026-03-26 16:35:55.575	calcutta-main	\N	t	2026-03-26 16:35:55.575	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ee132163-76b4-419a-96a2-7f6e7903e73e	Salted Peanuts (Haldiram)	2026-03-26 16:35:55.576	calcutta-main	\N	t	2026-03-26 16:35:55.576	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f31e6e83-379d-4db1-a569-4753608eab27	Aloo Bhujia Sev (Haldiram)	2026-03-26 16:35:55.576	calcutta-main	\N	t	2026-03-26 16:35:55.576	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
555837ad-ade0-41e8-a2eb-19da55dc54d3	Mixture (Haldiram)	2026-03-26 16:35:55.576	calcutta-main	\N	t	2026-03-26 16:35:55.576	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
c3a4aa7e-7ed0-4c32-86cd-df5303822517	Soya Stick (Haldiram)	2026-03-26 16:35:55.577	calcutta-main	\N	t	2026-03-26 16:35:55.577	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3ddf8c1b-6d06-423e-827f-5ce31a49ceae	Bomber Candy	2026-03-26 16:35:55.577	calcutta-main	\N	t	2026-03-26 16:35:55.577	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
630851bf-8e5e-4529-a90e-061294ceb351	One Up Chocobar Candy	2026-03-26 16:35:55.577	calcutta-main	\N	t	2026-03-26 16:35:55.577	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
c97ae993-d62f-4893-89cd-d9fe517ae7f3	Fantastic Candy	2026-03-26 16:35:55.577	calcutta-main	\N	t	2026-03-26 16:35:55.577	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
25e47ace-6a89-431a-bd8a-8607118a9759	Volcano Chocolate Cone	2026-03-26 16:35:55.578	calcutta-main	\N	t	2026-03-26 16:35:55.578	86324965-02f9-454f-8ad7-c9180af65d3c	f
e41496eb-680c-4ad9-90af-39d386d10dd4	Vadilal Treat Cone	2026-03-26 16:35:55.578	calcutta-main	\N	t	2026-03-26 16:35:55.578	86324965-02f9-454f-8ad7-c9180af65d3c	f
741b2a04-a4c9-4b27-b93d-45f5307c45e0	Chocolate Treat Cone	2026-03-26 16:35:55.578	calcutta-main	\N	t	2026-03-26 16:35:55.578	86324965-02f9-454f-8ad7-c9180af65d3c	f
904dad94-542b-4573-b7a0-6f5919155913	Chana Jor (Jobsons)	2026-03-26 16:35:55.578	calcutta-main	\N	t	2026-03-26 16:35:55.578	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8901808e-6a9f-4fd3-bda0-88d1d8470894	Manchurian Stick (National)	2026-03-26 16:35:55.578	calcutta-main	\N	t	2026-03-26 16:35:55.578	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2c330481-87cb-4dca-9a5e-3e904582d774	Soya Sticks (National)	2026-03-26 16:35:55.579	calcutta-main	\N	t	2026-03-26 16:35:55.579	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
eec5826f-dede-44f0-a221-4824f5725c5f	Sezwan Sticks (National)	2026-03-26 16:35:55.579	calcutta-main	\N	t	2026-03-26 16:35:55.579	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0c3f88bc-3c10-4c58-8860-2318c5143dc5	Sakkar Para	2026-03-26 16:35:55.579	calcutta-main	\N	t	2026-03-26 16:35:55.579	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
54ffc7d1-2905-42ce-8fd6-95b7cb456096	Gur Para	2026-03-26 16:35:55.579	calcutta-main	\N	t	2026-03-26 16:35:55.579	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
04756e0a-0f1a-4b90-84c3-d4eb5eea861e	Banana Wafers Black Pepper	2026-03-26 16:35:55.58	calcutta-main	\N	t	2026-03-26 16:35:55.58	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
27618afc-2868-4d63-accb-8a6f5961159d	Pan Mix Saunf (Shadani)	2026-03-26 16:35:55.58	calcutta-main	\N	t	2026-03-26 16:35:55.58	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a78bcf3f-2089-42d6-966d-82934b3b842e	Roasted Saunf (Shadani)	2026-03-26 16:35:55.58	calcutta-main	\N	t	2026-03-26 16:35:55.58	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
30854251-af5a-4a32-b95c-cb4eb7ae7f75	Orange Candy (Shadani)	2026-03-26 16:35:55.58	calcutta-main	\N	t	2026-03-26 16:35:55.58	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
27cd3574-8afe-415a-8a46-473b595a172b	Anardana Goli (Shadani)	2026-03-26 16:35:55.581	calcutta-main	\N	t	2026-03-26 16:35:55.581	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7ee2932c-47ef-4d55-9c57-6d7f873f7af6	Chatpati Imli (Shadani)	2026-03-26 16:35:55.581	calcutta-main	\N	t	2026-03-26 16:35:55.581	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c2c1f576-88d2-472c-9f77-88240e7cdff5	Elaichi Barfi	2026-03-26 16:35:55.581	calcutta-main	\N	t	2026-03-26 16:35:55.581	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9a975361-a172-48b5-bd36-506be4f0d2ad	Besan Barfi	2026-03-26 16:35:55.582	calcutta-main	\N	t	2026-03-26 16:35:55.582	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
58596386-83d6-4de2-8571-087d718941f3	Chocolate Barfi	2026-03-26 16:35:55.582	calcutta-main	\N	t	2026-03-26 16:35:55.582	f6460f7b-173d-426b-93d8-2b3587e7147d	f
ccf8af88-d50c-49f5-9298-95ac5c1b4a6d	Bundi Laddu (Ghee)	2026-03-26 16:35:55.582	calcutta-main	\N	t	2026-03-26 16:35:55.582	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f9caa2c4-5c16-47ac-972f-ccbb0ec92f87	Bundi Laddu (Dalda)	2026-03-26 16:35:55.582	calcutta-main	\N	t	2026-03-26 16:35:55.582	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bff9dff8-fae5-4682-b762-04c68c927791	Besan Laddu (Ghee)	2026-03-26 16:35:55.582	calcutta-main	\N	t	2026-03-26 16:35:55.582	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
831d4a88-f5b5-452b-9249-71e0839f4a0a	Mixture (Loose)	2026-03-26 16:35:55.583	calcutta-main	\N	t	2026-03-26 16:35:55.583	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
c3893512-5089-44a4-aa1a-08b64ad08a04	Jaggery (Gur)	2026-03-26 16:35:55.583	calcutta-main	\N	t	2026-03-26 16:35:55.583	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6a1ded4a-33f7-4646-a7c3-e223f2c882f3	Liquid Jaggery	2026-03-26 16:35:55.583	calcutta-main	\N	t	2026-03-26 16:35:55.583	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
67324d85-1533-4666-b1aa-5a268b0878eb	Pista Cookies	2026-03-26 16:35:55.583	calcutta-main	\N	t	2026-03-26 16:35:55.583	87524c0b-deea-4a33-95f7-216647a0ef8f	f
a83b4c14-8462-404b-81d1-b7a789c3dc6b	Lays Chips	2026-03-26 16:35:55.584	calcutta-main	\N	t	2026-03-26 16:35:55.584	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8b5744d6-35a9-49a6-883c-333daf439e82	Thandai (Guruji)	2026-03-26 16:35:55.584	calcutta-main	\N	t	2026-03-26 16:35:55.584	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cd3acd28-696a-4886-91bc-c3cb648a2a80	Jaljira (Jalani)	2026-03-26 16:35:55.584	calcutta-main	\N	t	2026-03-26 16:35:55.584	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f0dba77a-5c13-4b0e-9e22-56b2a6feb731	Decha Green	2026-03-26 16:35:55.584	calcutta-main	\N	t	2026-03-26 16:35:55.584	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c61541c7-e2e9-4b10-b00e-c2851718624c	Decha Red	2026-03-26 16:35:55.585	calcutta-main	\N	t	2026-03-26 16:35:55.585	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
14e2f5d0-1c0f-4433-98d3-51926541d611	Nariyal Pera	2026-03-26 16:35:55.585	calcutta-main	\N	t	2026-03-26 16:35:55.585	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bf3e19d0-950d-47a8-8bdb-57448cf1d482	Atta Khasta	2026-03-26 16:35:55.585	calcutta-main	\N	t	2026-03-26 16:35:55.585	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
42e17364-1931-4ee7-b85d-e6429cd2b324	Maida Khasta	2026-03-26 16:35:55.586	calcutta-main	\N	t	2026-03-26 16:35:55.586	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8286b7d5-c5dc-41c5-8f05-6e373b2029ff	Mitha Saloni	2026-03-26 16:35:55.586	calcutta-main	\N	t	2026-03-26 16:35:55.586	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c277552b-be81-406c-afa6-e4608388069f	Banana Chips	2026-03-26 16:35:55.586	calcutta-main	\N	t	2026-03-26 16:35:55.586	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
61335326-beae-4ce8-9c03-d577d5ee7063	Karela Chips	2026-03-26 16:35:55.587	calcutta-main	\N	t	2026-03-26 16:35:55.587	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
aaddb7e7-7739-491a-8cd4-0b2e3ad4f4f9	Potato Chips	2026-03-26 16:35:55.587	calcutta-main	\N	t	2026-03-26 16:35:55.587	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
395d5ba8-f549-403f-89b0-becd3da91ea8	Kachori	2026-03-26 16:35:55.587	calcutta-main	\N	t	2026-03-26 16:35:55.587	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
57e527e9-9bcc-4da0-b225-2187c626db07	Chakoli	2026-03-26 16:35:55.587	calcutta-main	\N	t	2026-03-26 16:35:55.587	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8d44a455-e8e6-440d-b67e-50333478f227	Bhakarwadi 1 Packet	2026-03-26 16:35:55.587	calcutta-main	\N	t	2026-03-26 16:35:55.587	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ef8307c5-69a0-4e55-af22-6bd83d36cc35	Falahari Mixture	2026-03-26 16:35:55.588	calcutta-main	\N	t	2026-03-26 16:35:55.588	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
38a16c09-845d-4fec-8094-ea41fdec8c81	Gupchup	2026-03-26 16:35:55.588	calcutta-main	\N	t	2026-03-26 16:35:55.588	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a186bf94-d99f-4f63-8ffe-f3b298a175b4	Haldiram Khata Meetha	2026-03-26 16:35:55.588	calcutta-main	\N	t	2026-03-26 16:35:55.588	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5877ef78-e396-4ac4-9b18-ba066a4c78b1	All in One Mixture	2026-03-26 16:35:55.589	calcutta-main	\N	t	2026-03-26 16:35:55.589	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
36f8885a-19b7-43c0-a372-1bed8fc1619f	Panchratan Mix	2026-03-26 16:35:55.589	calcutta-main	\N	t	2026-03-26 16:35:55.589	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3c184a52-e043-4b18-9889-1623d425f739	Haldiram Soan Papdi	2026-03-26 16:35:55.589	calcutta-main	\N	t	2026-03-26 16:35:55.589	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
92cdb6e0-a88c-4eef-b46d-703e6b44d7a1	Fika mathri	2026-03-26 16:37:30.013	SH000001	\N	t	2026-03-26 16:37:30.013	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a7a60be1-8ba1-4a75-ad9b-f621541d5e54	Mitha mathri	2026-03-26 16:37:30.019	SH000001	\N	t	2026-03-26 16:37:30.019	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
609588a0-c22a-4f7c-b2bb-e4f823aa002e	Khatta meetha	2026-03-26 16:37:30.021	SH000001	\N	t	2026-03-26 16:37:30.021	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
46809342-6c6b-4e97-980e-bb40c625c124	Maaza	2026-03-26 16:37:30.022	SH000001	\N	t	2026-03-26 16:37:30.022	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
961f6241-a35b-409e-a52d-f63541bf7c8e	Dry fruit laddu	2026-03-26 16:37:30.024	SH000001	\N	t	2026-03-26 16:37:30.024	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e7b654aa-94da-4429-a7ce-8440744b4056	Gud chana	2026-03-26 16:37:30.025	SH000001	\N	t	2026-03-26 16:37:30.025	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
09874618-8dda-4129-8477-c63e8298372a	Real juice apple t	2026-03-26 16:37:30.028	SH000001	\N	t	2026-03-26 16:37:30.028	f6460f7b-173d-426b-93d8-2b3587e7147d	f
d3c6d9a3-2157-404f-a7b4-a65dcc2519fa	Real grapes juice t	2026-03-26 16:37:30.029	SH000001	\N	t	2026-03-26 16:37:30.029	f6460f7b-173d-426b-93d8-2b3587e7147d	f
9ac215d7-aefa-4d7b-90af-2e974978e0b5	Futa chana	2026-03-26 16:37:30.03	SH000001	\N	t	2026-03-26 16:37:30.03	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
529a388b-40f5-441e-98ff-49a18e5a7fe0	Aam papad roll	2026-03-26 16:37:30.031	SH000001	\N	t	2026-03-26 16:37:30.031	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bbc5fb66-ffb8-41ff-a5bf-2544328dd905	Cheese Licks	2026-03-26 16:37:30.031	SH000001	\N	t	2026-03-26 16:37:30.031	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0c34e14b-9b64-4185-b472-74f37d393cc4	Top Butter Much (Bisk Farm)	2026-03-26 16:37:30.032	SH000001	\N	t	2026-03-26 16:37:30.032	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
28de2d5c-fee6-4e5c-a389-2d6f82314afb	Nice (Bisk Farm)	2026-03-26 16:37:30.033	SH000001	\N	t	2026-03-26 16:37:30.033	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
fe20bef7-ebcc-490c-ae7f-e8e68aa22043	Chatpata Spicy (Bisk Farm)	2026-03-26 16:37:30.034	SH000001	\N	t	2026-03-26 16:37:30.034	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3ac7da81-8a43-4ff6-abff-12171820c74f	Googly (Bisk Farm)	2026-03-26 16:37:30.035	SH000001	\N	t	2026-03-26 16:37:30.035	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5a478d2a-72d1-4ee8-a585-7a5d78e4202c	Top Herbs (Bisk Farm)	2026-03-26 16:37:30.036	SH000001	\N	t	2026-03-26 16:37:30.036	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7a73d8f1-40e0-4d6c-b12f-2bc6b9ccbeac	Chana Jor Salted	2026-03-26 16:37:30.037	SH000001	\N	t	2026-03-26 16:37:30.037	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
28323096-bc65-4144-b630-b527f14393fa	Sabudana Chips	2026-03-26 16:37:30.037	SH000001	\N	t	2026-03-26 16:37:30.037	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3ed349ec-cd85-40a7-b467-94127cd987c5	Royal Kreme	2026-03-26 16:37:30.038	SH000001	\N	t	2026-03-26 16:37:30.038	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e71ad1ef-eda9-4783-a90a-2b7c78cf25c7	Licks Orange (Bisk Farm)	2026-03-26 16:37:30.039	SH000001	\N	t	2026-03-26 16:37:30.039	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
32132c54-0787-4ceb-8d87-0fbe22c9811f	Jeera Wonder (Bisk Farm)	2026-03-26 16:37:30.04	SH000001	\N	t	2026-03-26 16:37:30.04	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cd9de66e-850c-44ba-be5a-8ba58e79f192	Coco Malai	2026-03-26 16:37:30.04	SH000001	\N	t	2026-03-26 16:37:30.04	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d2036eba-a8a0-4a3b-a3fc-9a2486846053	Pista Badam Biscuit	2026-03-26 16:37:30.041	SH000001	\N	t	2026-03-26 16:37:30.041	87524c0b-deea-4a33-95f7-216647a0ef8f	f
64fd278c-ac59-4386-ba6f-11f02c9486ec	Nankhatai Cookies	2026-03-26 16:37:30.042	SH000001	\N	t	2026-03-26 16:37:30.042	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
77a33656-9ff1-4492-b1cd-81bbb1c78d64	Atta Namkeen	2026-03-26 16:37:30.043	SH000001	\N	t	2026-03-26 16:37:30.043	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
9833bc7b-0a7a-4d0c-a4f6-5f24a2993cc4	Honey Oats Cookies	2026-03-26 16:37:30.044	SH000001	\N	t	2026-03-26 16:37:30.044	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
9429e1db-97f3-4268-8923-53abfe2bd082	Multi Grain Cookies	2026-03-26 16:37:30.044	SH000001	\N	t	2026-03-26 16:37:30.044	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
ba09d0e3-27c9-4bab-9d07-a0e8a1ba91d0	Pulpy Orange	2026-03-26 16:37:30.045	SH000001	\N	t	2026-03-26 16:37:30.045	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
59610467-74a1-4fbb-97bf-5dad1ae886fe	Fanta	2026-03-26 16:37:30.045	SH000001	\N	t	2026-03-26 16:37:30.045	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
394176a8-74ca-4233-8617-b07f5d0cbc8a	Real Grape Juice	2026-03-26 16:37:30.046	SH000001	\N	t	2026-03-26 16:37:30.046	f6460f7b-173d-426b-93d8-2b3587e7147d	f
6d455cd4-3966-421e-8155-6c6ceca7e71d	Vadilal Chocolate Chips Ice Cream	2026-03-26 16:37:30.047	SH000001	\N	t	2026-03-26 16:37:30.047	86324965-02f9-454f-8ad7-c9180af65d3c	f
93154c1e-a5d8-4b38-a90a-d603cb506265	Vadilal Butterscotch Brick	2026-03-26 16:37:30.047	SH000001	\N	t	2026-03-26 16:37:30.047	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b5e01407-3323-458c-b132-a62a0c448003	Vadilal American Nuts	2026-03-26 16:37:30.048	SH000001	\N	t	2026-03-26 16:37:30.048	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
195d1c37-03d3-4d41-8642-8db723cb31bd	Jalebi	2026-03-26 16:37:30.049	SH000001	\N	t	2026-03-26 16:37:30.049	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5ea21618-3fef-4559-acdd-580c68cee745	Chabeni Mixture	2026-03-26 16:37:30.049	SH000001	\N	t	2026-03-26 16:37:30.049	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
753c82cc-99f8-4bdf-bc85-3654e49c2e69	Khatta Mitha Mixture	2026-03-26 16:37:30.05	SH000001	\N	t	2026-03-26 16:37:30.05	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
95c91fc2-691a-452d-a0b7-77d85054a922	White Chocolate Kaju	2026-03-26 16:37:30.05	SH000001	\N	t	2026-03-26 16:37:30.05	f6460f7b-173d-426b-93d8-2b3587e7147d	f
3a134ff2-32fc-4e14-b632-ef7dd395a81b	Masala Sev	2026-03-26 16:37:30.051	SH000001	\N	t	2026-03-26 16:37:30.051	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
c113a1a6-ba9a-4c01-9215-f3528492e357	Chhappan Bhog	2026-03-26 16:37:30.052	SH000001	\N	t	2026-03-26 16:37:30.052	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2ae2e11f-6239-4ee4-8c43-6fdc9171634f	Amla Murabba	2026-03-26 16:37:30.053	SH000001	\N	t	2026-03-26 16:37:30.053	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cc0c6d8f-42d2-4712-b17f-0acc9a820a60	Mango Katli	2026-03-26 16:37:30.053	SH000001	\N	t	2026-03-26 16:37:30.053	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0d201566-c2ff-41bd-981c-6af1c0c040c9	Dry Samosa	2026-03-26 16:37:30.055	SH000001	\N	t	2026-03-26 16:37:30.055	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
3605be0f-3daa-499b-afe9-c7b0dbfd6326	Rabri	2026-03-26 16:37:30.055	SH000001	\N	t	2026-03-26 16:37:30.055	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d1075f55-15ea-452b-8546-e5a398394e95	Soan Papdi	2026-03-26 16:37:30.055	SH000001	\N	t	2026-03-26 16:37:30.055	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9286fed3-2620-40d3-a1a2-f27a5456896d	Aloo Gunda	2026-03-26 16:37:30.056	SH000001	\N	t	2026-03-26 16:37:30.056	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bb73ea89-fa59-4323-91a6-f549c38e4b9a	Sev	2026-03-26 16:37:30.057	SH000001	\N	t	2026-03-26 16:37:30.057	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
ae37f25b-50f9-492d-9c64-6dde72f48dfc	Sitabhog	2026-03-26 16:37:30.057	SH000001	\N	t	2026-03-26 16:37:30.057	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
fdc1c850-a241-464a-afa8-b8f7f1062b7d	Malpua	2026-03-26 16:37:30.057	SH000001	\N	t	2026-03-26 16:37:30.057	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ac276b58-ce52-4857-843e-d4fd2fd6b297	Akhrot	2026-03-26 16:37:30.058	SH000001	\N	t	2026-03-26 16:37:30.058	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4f58cf5b-e828-4073-9501-f59014100963	Kismis	2026-03-26 16:37:30.058	SH000001	\N	t	2026-03-26 16:37:30.058	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
22c549a1-d555-41ed-bd5a-8c8faf3d1580	Black Kismis	2026-03-26 16:37:30.059	SH000001	\N	t	2026-03-26 16:37:30.059	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c8a806d5-65d5-4774-a13a-e894571c8c29	Khajur (Lulu)	2026-03-26 16:37:30.059	SH000001	\N	t	2026-03-26 16:37:30.059	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
37876b8e-9a05-4add-a966-8e7a69759028	Khajur (Safawi)	2026-03-26 16:37:30.059	SH000001	\N	t	2026-03-26 16:37:30.059	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3939caf8-9953-4817-88a4-0efa448c161b	Anjir	2026-03-26 16:37:30.06	SH000001	\N	t	2026-03-26 16:37:30.06	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5d1e79a2-af75-4835-8904-5eca9d5e7e01	Mini Cone	2026-03-26 16:37:30.06	SH000001	\N	t	2026-03-26 16:37:30.06	86324965-02f9-454f-8ad7-c9180af65d3c	f
329635f2-a212-402f-9de0-54cac4e7f1a1	Cookie Disc Flingo Cone	2026-03-26 16:37:30.061	SH000001	\N	t	2026-03-26 16:37:30.061	86324965-02f9-454f-8ad7-c9180af65d3c	f
968b6352-912f-4188-9dd6-bcd904e215c1	Nutty Butterscotch Flingo Cone	2026-03-26 16:37:30.061	SH000001	\N	t	2026-03-26 16:37:30.061	86324965-02f9-454f-8ad7-c9180af65d3c	f
b44cab82-45c0-40b3-ad6a-844091654f5e	Choco Brownie Flingo Cone	2026-03-26 16:37:30.061	SH000001	\N	t	2026-03-26 16:37:30.061	86324965-02f9-454f-8ad7-c9180af65d3c	f
3fba1199-ee40-4a76-8494-cb46825cbcec	American Nuts Flingo Cone	2026-03-26 16:37:30.062	SH000001	\N	t	2026-03-26 16:37:30.062	86324965-02f9-454f-8ad7-c9180af65d3c	f
c3a1f8eb-4e0a-447b-96c0-5477c6fd0761	Gajar Halwa	2026-03-26 16:37:30.062	SH000001	\N	t	2026-03-26 16:37:30.062	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3638b745-491c-4205-bf86-d3ae376a4d79	Til Laddu	2026-03-26 16:37:30.063	SH000001	\N	t	2026-03-26 16:37:30.063	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a994464b-8c0d-4195-a902-9a944b846f5d	Chaat Plate	2026-03-26 16:37:30.063	SH000001	\N	t	2026-03-26 16:37:30.063	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
3297c65a-cf8a-4296-8648-1d4fbeaa8648	Patisa	2026-03-26 16:37:30.064	SH000001	\N	t	2026-03-26 16:37:30.064	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9f178f84-ad33-44b2-9eef-c3a42de90ce7	Haldiram Mixture	2026-03-26 16:37:30.064	SH000001	\N	t	2026-03-26 16:37:30.064	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
26b46b7a-8897-4017-a4d8-dd19024ad3ab	Badam	2026-03-26 16:37:30.064	SH000001	\N	t	2026-03-26 16:37:30.064	87524c0b-deea-4a33-95f7-216647a0ef8f	f
bb61cb90-228a-49e7-b961-a85c03043966	Malai Chamcham (Gur)	2026-03-26 16:37:30.065	SH000001	\N	t	2026-03-26 16:37:30.065	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f64fb85d-dd74-422c-a34b-87d13c283944	Kalakand (Gur)	2026-03-26 16:37:30.065	SH000001	\N	t	2026-03-26 16:37:30.065	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
84046e41-bbdb-4999-825b-b15296e51a6a	Rasgulla (Gur)	2026-03-26 16:37:30.066	SH000001	\N	t	2026-03-26 16:37:30.066	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6ffe7786-2cb3-4902-9bee-ab3ac0d40c77	Kachori Chaat (Full Plate)	2026-03-26 16:37:30.066	SH000001	\N	t	2026-03-26 16:37:30.066	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
43a9efb5-6876-4619-9031-91e88dc75473	Dhokla Chaat (Full Plate)	2026-03-26 16:37:30.067	SH000001	\N	t	2026-03-26 16:37:30.067	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
eb6d19cb-3fc8-4f32-9166-fa09a102d47d	Samosa (Half Plate)	2026-03-26 16:37:30.067	SH000001	\N	t	2026-03-26 16:37:30.067	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
663ead26-773c-468d-8cab-8f2f467a2338	Punjabi Masala Papad (Agrawal)	2026-03-26 16:37:30.068	SH000001	\N	t	2026-03-26 16:37:30.068	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
89abc180-af78-4e85-99a0-1f34cedbafbe	Khatta Mitha Chana Papad	2026-03-26 16:37:30.068	SH000001	\N	t	2026-03-26 16:37:30.068	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c72d9f44-1156-432b-9120-fed22f7a4ad5	Honey Muesli	2026-03-26 16:37:30.068	SH000001	\N	t	2026-03-26 16:37:30.068	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8d6f1ab3-2d8f-4216-8c63-ccd29077f631	Protein Bites	2026-03-26 16:37:30.069	SH000001	\N	t	2026-03-26 16:37:30.069	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
463bf74b-b3b3-478b-8cca-c4060e1b4ac8	Salted Muesli	2026-03-26 16:37:30.069	SH000001	\N	t	2026-03-26 16:37:30.069	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
22ca264f-0bc5-40ff-8852-a828a1831f2a	Faluda Mix Rose	2026-03-26 16:37:30.07	SH000001	\N	t	2026-03-26 16:37:30.07	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2f6f2d18-ac24-435b-a2c6-f1fbdd78c37e	Lal Mirch Lasun Paste	2026-03-26 16:37:30.071	SH000001	\N	t	2026-03-26 16:37:30.071	bf6479c6-f483-48d5-8d98-2e1346742072	f
6910af9b-1b2b-47e8-9332-b5ed62a48c63	Lemon Pickle (Nilon's)	2026-03-26 16:37:30.072	SH000001	\N	t	2026-03-26 16:37:30.072	bf6479c6-f483-48d5-8d98-2e1346742072	f
e1bba730-935b-4b88-910e-0c67549793f6	Red Chilli Pickle (Nilon's)	2026-03-26 16:37:30.072	SH000001	\N	t	2026-03-26 16:37:30.072	bf6479c6-f483-48d5-8d98-2e1346742072	f
b47624b9-133c-4c34-b030-f447f2ff2892	Garlic Pickle (Nilon's)	2026-03-26 16:37:30.072	SH000001	\N	t	2026-03-26 16:37:30.072	bf6479c6-f483-48d5-8d98-2e1346742072	f
2b7714b8-e0c9-49fa-bcb9-637e64dba8cd	Pepsi	2026-03-26 16:37:30.073	SH000001	\N	t	2026-03-26 16:37:30.073	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8b49fdc8-dfc3-4d10-8af1-45bcd110ace3	Pepsi 2.	2026-03-26 16:37:30.073	SH000001	\N	t	2026-03-26 16:37:30.073	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
61d8cb82-f806-4a91-9c7f-8a747321ee9c	7UP 2.	2026-03-26 16:37:30.074	SH000001	\N	t	2026-03-26 16:37:30.074	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f3eb6eac-2334-48aa-987e-bd0cf4d2ae8f	Coffee Milkshake	2026-03-26 16:37:30.075	SH000001	\N	t	2026-03-26 16:37:30.075	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
fde83cb6-6bfb-4552-a9ba-8ce1f5a25f08	Mini Butter Cookies	2026-03-26 16:37:30.075	SH000001	\N	t	2026-03-26 16:37:30.075	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
9cc6270b-f399-465f-86c8-2c3785e85b59	Karachi Fruit Biscuit	2026-03-26 16:37:30.075	SH000001	\N	t	2026-03-26 16:37:30.075	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
eda6d365-cc4e-4d7d-be50-098a32caa016	Mathari	2026-03-26 16:37:30.076	SH000001	\N	t	2026-03-26 16:37:30.076	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c5ca42cb-6d6f-4b54-9b78-afb05d2e676e	Kaju Cookies	2026-03-26 16:37:30.076	SH000001	\N	t	2026-03-26 16:37:30.076	87524c0b-deea-4a33-95f7-216647a0ef8f	f
28b5c164-9d13-487c-a76a-832a2a71379e	Cake Rusk	2026-03-26 16:37:30.076	SH000001	\N	t	2026-03-26 16:37:30.076	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
24f2ce54-050d-469b-9f76-86d01a66139d	Elaichi Toast (Haldiram)	2026-03-26 16:37:30.077	SH000001	\N	t	2026-03-26 16:37:30.077	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
75536682-f579-4b86-b5be-99527bb3ef88	Milk Toast (Haldiram)	2026-03-26 16:37:30.077	SH000001	\N	t	2026-03-26 16:37:30.077	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
caa9bcc6-60dc-4a77-87bc-777764c0fe1a	Pape Toast	2026-03-26 16:37:30.078	SH000001	\N	t	2026-03-26 16:37:30.078	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b575e965-9121-48c2-83e3-e2ad162926f4	Dry Fruit Khazana Cup	2026-03-26 16:37:30.078	SH000001	\N	t	2026-03-26 16:37:30.078	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9776b5bf-77c4-43b4-99ad-2369a49c6bea	Rajwadi Kulfi Candy	2026-03-26 16:37:30.079	SH000001	\N	t	2026-03-26 16:37:30.079	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
41265fd3-b120-465b-96dc-a8037c8c8422	Butterscotch Jumbo Cup	2026-03-26 16:37:30.08	SH000001	\N	t	2026-03-26 16:37:30.08	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e2fc4dc6-fd0e-4155-abfe-c525a2c95150	American Nuts Jumbo Cup	2026-03-26 16:37:30.08	SH000001	\N	t	2026-03-26 16:37:30.08	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9514bcc7-574b-406a-8e0b-0c032369c9f1	Slice Cassata	2026-03-26 16:37:30.08	SH000001	\N	t	2026-03-26 16:37:30.08	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6fd07b55-2e47-405c-bbcb-24af019efab4	Vanilla Ice Cream	2026-03-26 16:37:30.081	SH000001	\N	t	2026-03-26 16:37:30.081	86324965-02f9-454f-8ad7-c9180af65d3c	f
4410b45d-d429-47ca-b1cd-ceae8c3487eb	Hing Peda (Shadani)	2026-03-26 16:37:30.081	SH000001	\N	t	2026-03-26 16:37:30.081	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
33f3ddb6-3c4c-4662-b37b-08e0c2dd93ae	Paan Candy (Shadani)	2026-03-26 16:37:30.082	SH000001	\N	t	2026-03-26 16:37:30.082	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
a2dbf2e9-e048-401e-9373-655b0570a430	Sweet Amla (Shadani)	2026-03-26 16:37:30.082	SH000001	\N	t	2026-03-26 16:37:30.082	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
38f30993-a4dc-4e59-aec5-b8f85fbb0d64	Sahi Mix Saunf (Shadani)	2026-03-26 16:37:30.083	SH000001	\N	t	2026-03-26 16:37:30.083	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
06a6475e-f9ec-4e87-856e-cbe50f169d9f	Chatpata Amla (Shadani)	2026-03-26 16:37:30.083	SH000001	\N	t	2026-03-26 16:37:30.083	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0dea3ac4-6a19-4a1d-9c0d-ad75400857e3	Murra	2026-03-26 16:37:30.083	SH000001	\N	t	2026-03-26 16:37:30.083	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
07ee3693-ed77-4615-9a00-1a3e872855e0	Jhalmuri (Bikaji)	2026-03-26 16:37:30.084	SH000001	\N	t	2026-03-26 16:37:30.084	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4d429cfc-0922-402e-80e0-155316cec33a	Tasty Nuts (Haldiram)	2026-03-26 16:37:30.084	SH000001	\N	t	2026-03-26 16:37:30.084	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
96089537-5127-46cc-ae54-6bbdd974f8c2	Dry Fruits Mix	2026-03-26 16:37:30.084	SH000001	\N	t	2026-03-26 16:37:30.084	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
934d1028-9bd8-4eba-9422-978e979f4363	Navratan Mix (Haldiram)	2026-03-26 16:37:30.085	SH000001	\N	t	2026-03-26 16:37:30.085	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
86c40ce9-1a7d-4f81-8259-69f77191642c	Nimboo Pudina Chana (Jobsons)	2026-03-26 16:37:30.085	SH000001	\N	t	2026-03-26 16:37:30.085	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
35ca212e-e088-424b-8640-267aa8f216d7	Roasted Peanuts (Jobsons)	2026-03-26 16:37:30.086	SH000001	\N	t	2026-03-26 16:37:30.086	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b0d8bcd6-da49-4b5a-b7a5-1be20f8b5d96	Kaju Katli	2026-03-26 16:37:30.086	SH000001	\N	t	2026-03-26 16:37:30.086	87524c0b-deea-4a33-95f7-216647a0ef8f	f
158e7ead-641a-453c-9856-be830e938108	Sada Mixture	2026-03-26 16:37:30.086	SH000001	\N	t	2026-03-26 16:37:30.086	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
7eae12f1-40b7-4765-a1fa-8df3d06dc12c	Kaju Roll	2026-03-26 16:37:30.086	SH000001	\N	t	2026-03-26 16:37:30.086	87524c0b-deea-4a33-95f7-216647a0ef8f	f
258852a2-9937-46b7-8251-8e9767a017d4	Pista Almond Sweet	2026-03-26 16:37:30.087	SH000001	\N	t	2026-03-26 16:37:30.087	87524c0b-deea-4a33-95f7-216647a0ef8f	f
1402026f-ca72-49a5-9942-389feaec0da2	Lasun Sev	2026-03-26 16:37:30.087	SH000001	\N	t	2026-03-26 16:37:30.087	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
cc2d59c2-463f-4891-bcea-cbe61ff57ed7	Mota Sev	2026-03-26 16:37:30.087	SH000001	\N	t	2026-03-26 16:37:30.087	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
4c093ab5-b7c6-4a12-935c-14044b590c41	Real Apple Juice	2026-03-26 16:37:30.088	SH000001	\N	t	2026-03-26 16:37:30.088	f6460f7b-173d-426b-93d8-2b3587e7147d	f
15b48427-6b2d-4965-8f73-c51c4e288e37	Real Litchi Juice	2026-03-26 16:37:30.088	SH000001	\N	t	2026-03-26 16:37:30.088	f6460f7b-173d-426b-93d8-2b3587e7147d	f
098a1dcc-e092-4545-a290-1d036cc0a1b1	Real Mixed Fruit Juice	2026-03-26 16:37:30.088	SH000001	\N	t	2026-03-26 16:37:30.088	f6460f7b-173d-426b-93d8-2b3587e7147d	f
d364d7cd-5a77-433f-8578-4081a51d3264	Real Guava Juice	2026-03-26 16:37:30.089	SH000001	\N	t	2026-03-26 16:37:30.089	f6460f7b-173d-426b-93d8-2b3587e7147d	f
e721df39-d0e6-4923-add8-ff001513ef4e	Tropicana Mixed Fruit Juice	2026-03-26 16:37:30.089	SH000001	\N	t	2026-03-26 16:37:30.089	f6460f7b-173d-426b-93d8-2b3587e7147d	f
4e952297-1281-4780-a660-080cebaf7c62	Kurkure Masala Munch	2026-03-26 16:37:30.089	SH000001	\N	t	2026-03-26 16:37:30.089	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6a26c4e6-99d0-4fbd-b8ba-286b0d5c31c2	Kurkure Chilli Chatka	2026-03-26 16:37:30.09	SH000001	\N	t	2026-03-26 16:37:30.09	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ac5c0343-02bf-4fa6-8d1d-181196c2e42f	Lays Cream & Onion	2026-03-26 16:37:30.09	SH000001	\N	t	2026-03-26 16:37:30.09	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4189e0e4-5409-4e27-af38-8d6257f5ede1	Lays Spanish Tomato Tango	2026-03-26 16:37:30.09	SH000001	\N	t	2026-03-26 16:37:30.09	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
757141ec-9949-413c-acbb-53d36ac85211	Mirinda 2.	2026-03-26 16:37:30.091	SH000001	\N	t	2026-03-26 16:37:30.091	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
91ba974c-59d3-45fb-ae33-75e4e68cd145	Nimbooz	2026-03-26 16:37:30.091	SH000001	\N	t	2026-03-26 16:37:30.091	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
060c6967-1578-41ee-b6c3-03a10cce10f8	Red Bull	2026-03-26 16:37:30.091	SH000001	\N	t	2026-03-26 16:37:30.091	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c7155cfb-a694-4b57-98a2-ec7171dcb44a	Hell Energy Drink	2026-03-26 16:37:30.092	SH000001	\N	t	2026-03-26 16:37:30.092	f6460f7b-173d-426b-93d8-2b3587e7147d	f
1926b565-2c8b-4fc4-85b3-4c8236778e9a	Coconut Water	2026-03-26 16:37:30.092	SH000001	\N	t	2026-03-26 16:37:30.092	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bb642102-b30b-4bc2-83dd-f1415786ed21	Bisleri	2026-03-26 16:37:30.092	SH000001	\N	t	2026-03-26 16:37:30.092	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
aca71a65-5414-4c9e-9478-73573dfcd0d2	Misti Dahi (Small)	2026-03-26 16:37:30.094	SH000001	\N	t	2026-03-26 16:37:30.094	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c165a330-0021-47a9-9bc0-e71710cd2a84	Misti Dahi (Big)	2026-03-26 16:37:30.094	SH000001	\N	t	2026-03-26 16:37:30.094	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8524a550-fbc9-4fe5-8fb0-459e1fce5fa6	Rasmalai (Cup)	2026-03-26 16:37:30.094	SH000001	\N	t	2026-03-26 16:37:30.094	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2a301da4-0eca-48d4-8a32-ed112c43ec08	Rajbhog	2026-03-26 16:37:30.095	SH000001	\N	t	2026-03-26 16:37:30.095	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7c53c225-0b30-417d-bed6-6a1f1ab19e64	Rasgulla	2026-03-26 16:37:30.095	SH000001	\N	t	2026-03-26 16:37:30.095	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d3fca32a-1038-4ff1-b37a-ce421f65cd61	Kacha Golla (Gur)	2026-03-26 16:37:30.095	SH000001	\N	t	2026-03-26 16:37:30.095	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8addb5f5-f3d1-49da-96b5-5b7a560fc08c	Sugar Free Sweet	2026-03-26 16:37:30.096	SH000001	\N	t	2026-03-26 16:37:30.096	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ed55133c-1489-4369-a2b1-1d8f3206326b	Bundi (Ghee)	2026-03-26 16:37:30.096	SH000001	\N	t	2026-03-26 16:37:30.096	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
25ef752e-7266-4de7-82e9-8a3e2b98285c	Pinni Laddu	2026-03-26 16:37:30.096	SH000001	\N	t	2026-03-26 16:37:30.096	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
48b42451-40ab-4dc2-92ca-788845ffb69e	Gond Laddu	2026-03-26 16:37:30.097	SH000001	\N	t	2026-03-26 16:37:30.097	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b60d32b7-3f31-407a-80eb-b4ec69466c57	Sandesh	2026-03-26 16:37:30.097	SH000001	\N	t	2026-03-26 16:37:30.097	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9c699553-e8d6-4449-a0fa-02269602f5b9	Sandesh (Gur)	2026-03-26 16:37:30.097	SH000001	\N	t	2026-03-26 16:37:30.097	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
8114a5ae-532f-4d86-a4bb-c5ee24d630b3	Peda	2026-03-26 16:37:30.098	SH000001	\N	t	2026-03-26 16:37:30.098	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f6b01749-420e-4ca9-9609-ec11e66fcd80	Nariyal Barfi	2026-03-26 16:37:30.098	SH000001	\N	t	2026-03-26 16:37:30.098	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
78dc12ea-7c78-4c4c-a66c-256ac318cbb2	Nariyal Peda	2026-03-26 16:37:30.098	SH000001	\N	t	2026-03-26 16:37:30.098	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
30d3d94d-300f-4ee8-aebc-3175cbe8ae2e	Gujiya	2026-03-26 16:37:30.099	SH000001	\N	t	2026-03-26 16:37:30.099	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
696667ad-14c9-4070-9fa8-9acfe78653eb	Dry Gujiya	2026-03-26 16:37:30.099	SH000001	\N	t	2026-03-26 16:37:30.099	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2380ab21-cf36-4a8c-b116-303085828cdb	Gulab Jamun	2026-03-26 16:37:30.099	SH000001	\N	t	2026-03-26 16:37:30.099	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
92949727-e7ca-4bfb-b48a-44ce2c2a10cf	Kala Jamun	2026-03-26 16:37:30.1	SH000001	\N	t	2026-03-26 16:37:30.1	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
81b11fdf-9d15-4f74-a10f-205e44ac966d	Roasted Badam	2026-03-26 16:37:30.1	SH000001	\N	t	2026-03-26 16:37:30.1	87524c0b-deea-4a33-95f7-216647a0ef8f	f
f06dbf63-5305-43bc-8d63-5397804b1fa7	Mix Nuts	2026-03-26 16:37:30.1	SH000001	\N	t	2026-03-26 16:37:30.1	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6748c80a-1355-4193-8d21-d0a69de39cab	Khajur (Sharbat)	2026-03-26 16:37:30.101	SH000001	\N	t	2026-03-26 16:37:30.101	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
380665da-a244-482e-b3fa-75c9f05661dc	Roasted Pista	2026-03-26 16:37:30.101	SH000001	\N	t	2026-03-26 16:37:30.101	87524c0b-deea-4a33-95f7-216647a0ef8f	f
e3564809-bd65-4451-b416-5e86d569efee	Roasted Kaju	2026-03-26 16:37:30.101	SH000001	\N	t	2026-03-26 16:37:30.101	87524c0b-deea-4a33-95f7-216647a0ef8f	f
1f178c92-0a3e-49ed-841d-d15ba969461e	Sada Kaju	2026-03-26 16:37:30.102	SH000001	\N	t	2026-03-26 16:37:30.102	87524c0b-deea-4a33-95f7-216647a0ef8f	f
6c3a9bc5-090a-437e-8c72-8facc394bcb6	Chocolate Chips Ice Cream	2026-03-26 16:37:30.102	SH000001	\N	t	2026-03-26 16:37:30.102	86324965-02f9-454f-8ad7-c9180af65d3c	f
b448c4fe-3699-4547-8ed0-7ab026783c2d	Pista Cone	2026-03-26 16:37:30.103	SH000001	\N	t	2026-03-26 16:37:30.103	86324965-02f9-454f-8ad7-c9180af65d3c	f
b3c35dad-5153-4156-89ac-f1058d77404c	Butterscotch Cone	2026-03-26 16:37:30.103	SH000001	\N	t	2026-03-26 16:37:30.103	86324965-02f9-454f-8ad7-c9180af65d3c	f
24a886f2-6394-4d5b-ac5c-f7a35ca253ec	Amul Fresh Cream	2026-03-26 16:37:30.103	SH000001	\N	t	2026-03-26 16:37:30.103	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a135657f-4fa0-4ea4-835c-fa79518af720	Mini Bakharwadi	2026-03-26 16:37:30.103	SH000001	\N	t	2026-03-26 16:37:30.103	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2c38eebd-14b9-4fe3-ba62-69174f826b35	Mango Delight	2026-03-26 16:37:30.104	SH000001	\N	t	2026-03-26 16:37:30.104	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
75b949a9-8f8b-4aa7-885c-5987d17f8305	Mathri	2026-03-26 16:37:30.104	SH000001	\N	t	2026-03-26 16:37:30.104	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2e00a94b-08b5-4a9a-916e-509f1c891650	Jeera Mathri	2026-03-26 16:37:30.105	SH000001	\N	t	2026-03-26 16:37:30.105	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c21ee8af-e209-4c4e-a14a-8460e79984d6	Methi Mathri	2026-03-26 16:37:30.105	SH000001	\N	t	2026-03-26 16:37:30.105	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
61e0d62f-d7e4-41e4-a969-8c1f074dbc85	Lasun Mathri	2026-03-26 16:37:30.106	SH000001	\N	t	2026-03-26 16:37:30.106	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1a313768-69a7-4863-808c-c7a77ac0456d	Bhujia Sev (Haldiram)	2026-03-26 16:37:30.106	SH000001	\N	t	2026-03-26 16:37:30.106	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
d6bcb2d5-8027-49db-9c56-dc2aad8d370c	Chana Chur (Bikaji)	2026-03-26 16:37:30.106	SH000001	\N	t	2026-03-26 16:37:30.106	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
91d0a98e-a416-4f75-9941-d6dced5a9e3b	All in One Namkeen (Haldiram)	2026-03-26 16:37:30.107	SH000001	\N	t	2026-03-26 16:37:30.107	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
8186497e-b237-494d-bd62-5c794b677c15	Samosa	2026-03-26 16:37:30.107	SH000001	\N	t	2026-03-26 16:37:30.107	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
07c68e5e-e524-43ef-baf2-746db536a440	Crunchy Butterscotch Ice Cream Tub	2026-03-26 16:37:30.108	SH000001	\N	t	2026-03-26 16:37:30.108	86324965-02f9-454f-8ad7-c9180af65d3c	f
41929f46-6e38-42cd-adfb-e22f1bb70233	Dark Chocolate Ice Cream Tub	2026-03-26 16:37:30.108	SH000001	\N	t	2026-03-26 16:37:30.108	86324965-02f9-454f-8ad7-c9180af65d3c	f
a51b703c-e82a-4699-9f63-f693347a61ec	Belgian Chocolate Ice Cream Tub	2026-03-26 16:37:30.108	SH000001	\N	t	2026-03-26 16:37:30.108	86324965-02f9-454f-8ad7-c9180af65d3c	f
e70ff601-aa5a-4ed6-92ef-03006e191a88	Kesar Rasmalai Ice Cream Tub	2026-03-26 16:37:30.108	SH000001	\N	t	2026-03-26 16:37:30.108	86324965-02f9-454f-8ad7-c9180af65d3c	f
6e6ae8cf-c47f-4945-8a38-fe0093620002	Classic Malai Ice Cream Tub	2026-03-26 16:37:30.109	SH000001	\N	t	2026-03-26 16:37:30.109	86324965-02f9-454f-8ad7-c9180af65d3c	f
b0807663-9191-4a36-a195-a5efa62bc099	Falooda Ice Cream Tub	2026-03-26 16:37:30.109	SH000001	\N	t	2026-03-26 16:37:30.109	86324965-02f9-454f-8ad7-c9180af65d3c	f
a87e58b2-a82e-4daf-941e-b4bc2c1e0e79	Real Cranberry Juice	2026-03-26 16:37:30.109	SH000001	\N	t	2026-03-26 16:37:30.109	f6460f7b-173d-426b-93d8-2b3587e7147d	f
e326e5c0-9621-4c69-8ebc-08656c67feca	Real Pomegranate Juice	2026-03-26 16:37:30.11	SH000001	\N	t	2026-03-26 16:37:30.11	f6460f7b-173d-426b-93d8-2b3587e7147d	f
cf13f4d2-5666-4e11-ba95-dfcc4d3c8567	Real Pineapple Juice	2026-03-26 16:37:30.11	SH000001	\N	t	2026-03-26 16:37:30.11	f6460f7b-173d-426b-93d8-2b3587e7147d	f
45dd1c0b-fbd6-4ae2-bbab-a83386a9f001	Real Mosambi Juice	2026-03-26 16:37:30.111	SH000001	\N	t	2026-03-26 16:37:30.111	f6460f7b-173d-426b-93d8-2b3587e7147d	f
a5fc5ce5-c3d4-4918-a410-afaec477c2f1	Khakhra (Kanidha)	2026-03-26 16:37:30.111	SH000001	\N	t	2026-03-26 16:37:30.111	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ddc3d25f-3019-4c02-9bc3-6c774434e16d	Sada Papad	2026-03-26 16:37:30.111	SH000001	\N	t	2026-03-26 16:37:30.111	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
dffe6874-c0c4-41a0-aee9-6bcc690de836	Milk Cake (Lamba)	2026-03-26 16:37:30.112	SH000001	\N	t	2026-03-26 16:37:30.112	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
09324567-6084-4d8a-bbe9-d98975559dfe	Doda Barfi	2026-03-26 16:37:30.112	SH000001	\N	t	2026-03-26 16:37:30.112	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7352acd4-ebd3-4e36-80fa-e26e5c867c12	Anjir Roll	2026-03-26 16:37:30.114	SH000001	\N	t	2026-03-26 16:37:30.114	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
134a7630-c62f-47fd-8347-30de136aecab	Milk Cake (Box)	2026-03-26 16:37:30.115	SH000001	\N	t	2026-03-26 16:37:30.115	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
24308bfb-2da3-4970-b37c-30146e01221e	Kheer Kadam	2026-03-26 16:37:30.115	SH000001	\N	t	2026-03-26 16:37:30.115	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
84ae9092-0afa-4bdb-8d23-f8d1887c29b5	Malai Barfi	2026-03-26 16:37:30.115	SH000001	\N	t	2026-03-26 16:37:30.115	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bd8efbf0-4b07-49e3-ad6f-e5651322fc45	Sprite	2026-03-26 16:37:30.116	SH000001	\N	t	2026-03-26 16:37:30.116	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
99909606-f9e2-41cc-bac3-10068c667c53	Thums Up  Can	2026-03-26 16:37:30.117	SH000001	\N	t	2026-03-26 16:37:30.117	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2627b3d7-1d05-4bbe-959e-fdf9803b9e99	Thums Up	2026-03-26 16:37:30.117	SH000001	\N	t	2026-03-26 16:37:30.117	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9b90d346-8c9f-498c-9701-46dcb3f63d27	Petha (Haldiram)	2026-03-26 16:37:30.118	SH000001	\N	t	2026-03-26 16:37:30.118	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3aee962c-35ed-4be3-93a3-ff35e7ee329f	Chikki	2026-03-26 16:37:30.118	SH000001	\N	t	2026-03-26 16:37:30.118	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
172d2cb1-9054-4085-8a3d-f891cc8d1b6f	Red Chilli (DLS)	2026-03-26 16:37:30.118	SH000001	\N	t	2026-03-26 16:37:30.118	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
43e96816-804c-4f04-98fb-dc6c59558d6b	Green Chilli (DLS)	2026-03-26 16:37:30.119	SH000001	\N	t	2026-03-26 16:37:30.119	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5ba4ce1f-68ea-4fa4-96fa-b68e44f227c1	Kaju	2026-03-26 16:37:30.119	SH000001	\N	t	2026-03-26 16:37:30.119	87524c0b-deea-4a33-95f7-216647a0ef8f	f
39a63727-ad90-4361-8a07-47372f31d8c2	Gujiya (Piece)	2026-03-26 16:37:30.119	SH000001	\N	t	2026-03-26 16:37:30.119	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a426de3f-5e58-4802-90d1-f394045a5f35	Khoya	2026-03-26 16:37:30.119	SH000001	\N	t	2026-03-26 16:37:30.119	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b419f1fe-2a26-4cdd-aae8-e87c5745ae4e	Cutlet Samosa	2026-03-26 16:37:30.12	SH000001	\N	t	2026-03-26 16:37:30.12	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
fa693c36-56b7-455f-8209-3812eeb51207	Green Peas	2026-03-26 16:37:30.12	SH000001	\N	t	2026-03-26 16:37:30.12	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2bd7a322-26fb-4220-bdbf-2dfbe1059e8b	Thepla	2026-03-26 16:37:30.12	SH000001	\N	t	2026-03-26 16:37:30.12	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6d120581-550e-4ad8-a99f-a6d4aa32a102	Badam Cookies	2026-03-26 16:37:30.121	SH000001	\N	t	2026-03-26 16:37:30.121	87524c0b-deea-4a33-95f7-216647a0ef8f	f
efef0802-3935-4a10-8bbb-4d9a6bce6cb0	Butter Cookies	2026-03-26 16:37:30.121	SH000001	\N	t	2026-03-26 16:37:30.121	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
33095f31-7690-437c-b1d2-d62cbd754181	Coconut Jaggery Cookies	2026-03-26 16:37:30.121	SH000001	\N	t	2026-03-26 16:37:30.121	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
1bef6ac3-0e43-4461-8870-c63cc51d6ec8	Litchi Drink	2026-03-26 16:37:30.122	SH000001	\N	t	2026-03-26 16:37:30.122	f6460f7b-173d-426b-93d8-2b3587e7147d	f
0c454422-3525-4882-a7d7-c1021c705732	Cream Bell Coffee	2026-03-26 16:37:30.122	SH000001	\N	t	2026-03-26 16:37:30.122	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
89eb8225-6e7e-486a-8b19-296ef382b1cd	Cream Bell Kesar Badam	2026-03-26 16:37:30.123	SH000001	\N	t	2026-03-26 16:37:30.123	87524c0b-deea-4a33-95f7-216647a0ef8f	f
95b50642-92d3-45dd-8c49-d0c2bb51f9c1	Cream Bell Chocolate	2026-03-26 16:37:30.123	SH000001	\N	t	2026-03-26 16:37:30.123	f6460f7b-173d-426b-93d8-2b3587e7147d	f
c7cb4ef2-863f-440b-b325-60184de87819	Mirinda	2026-03-26 16:37:30.123	SH000001	\N	t	2026-03-26 16:37:30.123	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
373ae1c9-b118-4a16-90f6-5632c6d562f3	Coca Cola	2026-03-26 16:37:30.124	SH000001	\N	t	2026-03-26 16:37:30.124	f6460f7b-173d-426b-93d8-2b3587e7147d	f
6293d559-c68c-49d4-a0d6-1bb415f48d66	Goli Soda	2026-03-26 16:37:30.124	SH000001	\N	t	2026-03-26 16:37:30.124	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c55afd12-27cf-4ba4-b709-7d49ad0af536	Bisk Farm Top Crunch Biscuit	2026-03-26 16:37:30.125	SH000001	\N	t	2026-03-26 16:37:30.125	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
dcbb2ec6-b02c-4d06-8c9c-25bd37c47f68	Bisk Farm Googly Bite Biscuit	2026-03-26 16:37:30.125	SH000001	\N	t	2026-03-26 16:37:30.125	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
858f7437-5c70-43f9-bb05-aef001ca6fd2	Mountain Dew 1.	2026-03-26 16:37:30.125	SH000001	\N	t	2026-03-26 16:37:30.125	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f16e1fee-fea8-4e50-8294-d733b70ef67e	Lite Chiwda	2026-03-26 16:37:30.126	SH000001	\N	t	2026-03-26 16:37:30.126	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c3e91cd0-c2e3-4a1c-93ae-3656861240fc	Modak	2026-03-26 16:37:30.126	SH000001	\N	t	2026-03-26 16:37:30.126	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
56cce2ec-49de-4e5d-925c-6f6144fe7eef	Besan Modak	2026-03-26 16:37:30.126	SH000001	\N	t	2026-03-26 16:37:30.126	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d2857216-1596-4fab-831d-791e9291168f	Bundi Modak (Ghee)	2026-03-26 16:37:30.127	SH000001	\N	t	2026-03-26 16:37:30.127	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c984a2a0-51e2-48c9-855e-e3f06b9e785b	Khasta	2026-03-26 16:37:30.127	SH000001	\N	t	2026-03-26 16:37:30.127	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e09fdb5d-494d-475b-b027-8007d2bd9df5	Barik Saloni	2026-03-26 16:37:30.128	SH000001	\N	t	2026-03-26 16:37:30.128	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
9ec0e1d6-6c21-49e6-be91-16d98ee61e7c	Palak Mathri	2026-03-26 16:37:30.128	SH000001	\N	t	2026-03-26 16:37:30.128	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
799a99e6-c82c-4525-ad7a-d02cdf4efad3	Saloni	2026-03-26 16:37:30.128	SH000001	\N	t	2026-03-26 16:37:30.128	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4e5b3339-12a7-4c21-b374-47759d095e82	Rooh Afza Sharbat	2026-03-26 16:37:30.128	SH000001	\N	t	2026-03-26 16:37:30.128	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
65c26de7-4f01-454b-a710-9428643223b6	Mala's Orange Crush	2026-03-26 16:37:30.129	SH000001	\N	t	2026-03-26 16:37:30.129	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
64e0d892-b0d7-455e-903e-21b276bc5c1c	Mala's Banana Crush	2026-03-26 16:37:30.129	SH000001	\N	t	2026-03-26 16:37:30.129	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a0a5ce00-27ad-4dad-9d3b-b30d4593a222	Mala's Watermelon Syrup	2026-03-26 16:37:30.13	SH000001	\N	t	2026-03-26 16:37:30.13	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6ed59274-c53f-4a04-b957-c1f4244c12c2	Mala's Lime Cordial	2026-03-26 16:37:30.13	SH000001	\N	t	2026-03-26 16:37:30.13	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ec75f386-6249-4e73-8540-4bdab5f0d4d9	Real Orange Juice	2026-03-26 16:37:30.13	SH000001	\N	t	2026-03-26 16:37:30.13	f6460f7b-173d-426b-93d8-2b3587e7147d	f
4ed7f776-4df9-4631-a9c6-60befc4a1a17	Kacha Golla	2026-03-26 16:37:30.131	SH000001	\N	t	2026-03-26 16:37:30.131	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d795a800-31b3-4220-809f-89401d1b710f	Nikuti	2026-03-26 16:37:30.131	SH000001	\N	t	2026-03-26 16:37:30.131	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
bae9ac84-a426-4c16-ba5b-f895d93e8b2d	Pantua	2026-03-26 16:37:30.131	SH000001	\N	t	2026-03-26 16:37:30.131	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
dac1857a-fb3e-4f57-abba-294b88809692	Paneer	2026-03-26 16:37:30.132	SH000001	\N	t	2026-03-26 16:37:30.132	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4bbcad90-fa58-4c5e-8881-7efb943fa6ba	Curd (Dahi)	2026-03-26 16:37:30.132	SH000001	\N	t	2026-03-26 16:37:30.132	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
03bc80ac-7739-4c11-8de2-ff20fdd8be8a	Misti Dahi	2026-03-26 16:37:30.132	SH000001	\N	t	2026-03-26 16:37:30.132	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ed7511a3-7c26-4189-ad0d-6a0612a986f5	Cutlet	2026-03-26 16:37:30.133	SH000001	\N	t	2026-03-26 16:37:30.133	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
cfae706b-516e-4203-8904-63e8faf2844f	Kesar Lassi (Glass)	2026-03-26 16:37:30.133	SH000001	\N	t	2026-03-26 16:37:30.133	f6460f7b-173d-426b-93d8-2b3587e7147d	f
9eacfb3a-7aac-4fa9-8aa8-a9e78a14bac9	KitKat Small	2026-03-26 16:37:30.133	SH000001	\N	t	2026-03-26 16:37:30.133	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5d2a25de-9db7-45fc-8a17-bc8ef80a6c23	KitKat Medium	2026-03-26 16:37:30.134	SH000001	\N	t	2026-03-26 16:37:30.134	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
85bd8cdc-2f49-492c-b675-a490d2bee92d	Frozen Green Peas	2026-03-26 16:37:30.134	SH000001	\N	t	2026-03-26 16:37:30.134	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
0e5c040d-fe6d-4153-8ccb-aaa5262340fa	Butterscotch Ice Cream Cup	2026-03-26 16:37:30.134	SH000001	\N	t	2026-03-26 16:37:30.134	86324965-02f9-454f-8ad7-c9180af65d3c	f
292fdf78-c388-4ffa-9152-de2f17aae5dd	Strawberry Ice Cream Cup	2026-03-26 16:37:30.135	SH000001	\N	t	2026-03-26 16:37:30.135	86324965-02f9-454f-8ad7-c9180af65d3c	f
367be81d-6095-46a0-8302-73e618530d91	American Nuts Ice Cream Cup	2026-03-26 16:37:30.135	SH000001	\N	t	2026-03-26 16:37:30.135	86324965-02f9-454f-8ad7-c9180af65d3c	f
9eeda147-3a7e-46d6-b946-2b61c24ab012	Choco Brownie Ice Cream Cup	2026-03-26 16:37:30.135	SH000001	\N	t	2026-03-26 16:37:30.135	86324965-02f9-454f-8ad7-c9180af65d3c	f
c1007e31-dffd-411a-814f-cd0eecd020c4	Vanilla Brownie Ice Cream Tub	2026-03-26 16:37:30.136	SH000001	\N	t	2026-03-26 16:37:30.136	86324965-02f9-454f-8ad7-c9180af65d3c	f
d49c8ecd-03fd-4e72-a5fb-f638b5ff26b1	American Nuts Ice Cream Tub	2026-03-26 16:37:30.136	SH000001	\N	t	2026-03-26 16:37:30.136	86324965-02f9-454f-8ad7-c9180af65d3c	f
9c9c5e7e-0b0d-4ee5-88da-413c2c5a2ea0	Amul Masti Lassi	2026-03-26 16:37:30.136	SH000001	\N	t	2026-03-26 16:37:30.136	f6460f7b-173d-426b-93d8-2b3587e7147d	f
c2fbfca4-5226-434f-a2ee-503d3d651d08	Heylo Butter Cookies	2026-03-26 16:37:30.136	SH000001	\N	t	2026-03-26 16:37:30.136	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	f
46982de1-8cb1-482d-972b-fdde06c6141e	Paper Plate Small	2026-03-26 16:37:30.137	SH000001	\N	t	2026-03-26 16:37:30.137	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
803c47b4-32c7-481d-843a-3334144640fb	Paper Plate Large	2026-03-26 16:37:30.137	SH000001	\N	t	2026-03-26 16:37:30.137	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4234cc96-8cd0-44d9-ac31-faee97d2d9fa	Paper Glass	2026-03-26 16:37:30.137	SH000001	\N	t	2026-03-26 16:37:30.137	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
3463231c-0017-4311-bb8e-60a43910b4c1	Plastic Spoon	2026-03-26 16:37:30.138	SH000001	\N	t	2026-03-26 16:37:30.138	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d479032b-197d-43bc-9d64-227028f34365	Sting Energy Drink	2026-03-26 16:37:30.138	SH000001	\N	t	2026-03-26 16:37:30.138	f6460f7b-173d-426b-93d8-2b3587e7147d	f
cc0fa830-6374-40f1-b369-f621d7843a98	Limca	2026-03-26 16:37:30.138	SH000001	\N	t	2026-03-26 16:37:30.138	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
943dbeb2-e6d7-4f40-bb59-e8ef3663abc6	Kinley Soda	2026-03-26 16:37:30.138	SH000001	\N	t	2026-03-26 16:37:30.138	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
4d0a4720-d347-44bb-98aa-ee428912b932	Mewa Bites	2026-03-26 16:37:30.139	SH000001	\N	t	2026-03-26 16:37:30.139	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
eced7e5d-a0e9-48a3-9531-e7e69ca3d196	Balushahi	2026-03-26 16:37:30.139	SH000001	\N	t	2026-03-26 16:37:30.139	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d0a34b83-6aac-4c4c-a2cf-c2997419f89f	Sandwich Malai Chap	2026-03-26 16:37:30.139	SH000001	\N	t	2026-03-26 16:37:30.139	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7a000793-b639-4795-b908-3f90aeac9f99	Bisleri  (Pack)	2026-03-26 16:37:30.14	SH000001	\N	t	2026-03-26 16:37:30.14	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
78383789-46af-419c-b4ca-156aca1d11e3	Khoya Jalebi	2026-03-26 16:37:30.14	SH000001	\N	t	2026-03-26 16:37:30.14	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f4164d59-59a8-4a4f-a0e9-1432ffe1be0d	Malai Chap	2026-03-26 16:37:30.14	SH000001	\N	t	2026-03-26 16:37:30.14	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
68f4329a-10f7-486c-af35-af24ce523a26	Malai Toast	2026-03-26 16:37:30.14	SH000001	\N	t	2026-03-26 16:37:30.14	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
90e5f036-eaa2-4e97-8c4f-418a3c1b3c9c	Malai Chamcham	2026-03-26 16:37:30.141	SH000001	\N	t	2026-03-26 16:37:30.141	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
606c3d2d-4163-487e-b11e-ded69c198617	Chamcham	2026-03-26 16:37:30.141	SH000001	\N	t	2026-03-26 16:37:30.141	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
78bff725-9cf6-445d-bd5b-6cf73b571df8	Rasbhari	2026-03-26 16:37:30.141	SH000001	\N	t	2026-03-26 16:37:30.141	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
377eca6f-a88f-473a-bcdd-9048af32daf2	Green Chilli Pickle	2026-03-26 16:37:30.141	SH000001	\N	t	2026-03-26 16:37:30.141	bf6479c6-f483-48d5-8d98-2e1346742072	f
a0c18532-b27d-4259-9c3a-94c0b70fbaae	Mango Pickle	2026-03-26 16:37:30.142	SH000001	\N	t	2026-03-26 16:37:30.142	bf6479c6-f483-48d5-8d98-2e1346742072	f
5de5c15f-c2dd-4ba5-9046-94960166e737	Lemon Pickle	2026-03-26 16:37:30.142	SH000001	\N	t	2026-03-26 16:37:30.142	bf6479c6-f483-48d5-8d98-2e1346742072	f
cf45e6fd-75a2-411b-8d71-503372510fdd	Sweet Lemon Pickle	2026-03-26 16:37:30.143	SH000001	\N	t	2026-03-26 16:37:30.143	bf6479c6-f483-48d5-8d98-2e1346742072	f
de92b7e6-2997-4ee1-8c29-ffb927c382cd	Tomato Ketchup 1.	2026-03-26 16:37:30.143	SH000001	\N	t	2026-03-26 16:37:30.143	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a22212ea-6cd6-46b1-9935-360ad0519baf	Salted Peanuts (Haldiram)	2026-03-26 16:37:30.143	SH000001	\N	t	2026-03-26 16:37:30.143	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
07674ef6-4ee7-489f-adb2-2ca03b97cd59	Aloo Bhujia Sev (Haldiram)	2026-03-26 16:37:30.144	SH000001	\N	t	2026-03-26 16:37:30.144	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
9827a8df-fade-4f81-bb01-449c34282255	Mixture (Haldiram)	2026-03-26 16:37:30.144	SH000001	\N	t	2026-03-26 16:37:30.144	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
5963a6e1-7f9f-433c-b962-d48d56d019c4	Soya Stick (Haldiram)	2026-03-26 16:37:30.144	SH000001	\N	t	2026-03-26 16:37:30.144	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
78a57841-a129-4089-befa-47eddf619b35	Bomber Candy	2026-03-26 16:37:30.145	SH000001	\N	t	2026-03-26 16:37:30.145	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
487fd724-d726-4b2e-92b1-95362f6be7d7	One Up Chocobar Candy	2026-03-26 16:37:30.145	SH000001	\N	t	2026-03-26 16:37:30.145	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
1b640fae-29e5-4933-9c84-c6cb7c7e09d0	Fantastic Candy	2026-03-26 16:37:30.145	SH000001	\N	t	2026-03-26 16:37:30.145	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
3b188989-6017-4e98-8223-f7065ef5fa2e	Volcano Chocolate Cone	2026-03-26 16:37:30.146	SH000001	\N	t	2026-03-26 16:37:30.146	86324965-02f9-454f-8ad7-c9180af65d3c	f
182f1b3d-4bfe-411d-8e19-2bae97993022	Vadilal Treat Cone	2026-03-26 16:37:30.146	SH000001	\N	t	2026-03-26 16:37:30.146	86324965-02f9-454f-8ad7-c9180af65d3c	f
4638056a-b816-418d-be7e-7862124cb3bc	Chocolate Treat Cone	2026-03-26 16:37:30.146	SH000001	\N	t	2026-03-26 16:37:30.146	86324965-02f9-454f-8ad7-c9180af65d3c	f
2a5b72ba-e377-4d57-9d21-e92651194f58	Chana Jor (Jobsons)	2026-03-26 16:37:30.146	SH000001	\N	t	2026-03-26 16:37:30.146	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
c56996c8-3293-44c0-8e43-bf444b053cf1	Manchurian Stick (National)	2026-03-26 16:37:30.147	SH000001	\N	t	2026-03-26 16:37:30.147	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
b3af3199-5210-4795-be2d-7a07e0c0836c	Soya Sticks (National)	2026-03-26 16:37:30.147	SH000001	\N	t	2026-03-26 16:37:30.147	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
240ad075-3ecd-45bb-adc3-c7778a36df23	Sezwan Sticks (National)	2026-03-26 16:37:30.147	SH000001	\N	t	2026-03-26 16:37:30.147	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1de6d49b-1676-4f44-981a-2c77f14b7702	Sakkar Para	2026-03-26 16:37:30.148	SH000001	\N	t	2026-03-26 16:37:30.148	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e2ef3141-38fd-4978-a84b-d5732d6e92ce	Gur Para	2026-03-26 16:37:30.148	SH000001	\N	t	2026-03-26 16:37:30.148	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5331eeab-09e5-46a3-a797-fd385710c91c	Banana Wafers Black Pepper	2026-03-26 16:37:30.148	SH000001	\N	t	2026-03-26 16:37:30.148	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
22ecd126-9dfa-4308-83e8-9821dff57156	Pan Mix Saunf (Shadani)	2026-03-26 16:37:30.148	SH000001	\N	t	2026-03-26 16:37:30.148	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7358b8d1-ca1e-450a-8913-3acc3e82f699	Roasted Saunf (Shadani)	2026-03-26 16:37:30.149	SH000001	\N	t	2026-03-26 16:37:30.149	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
16c060b1-2ee2-46a4-99d0-5165d2dc1725	Orange Candy (Shadani)	2026-03-26 16:37:30.149	SH000001	\N	t	2026-03-26 16:37:30.149	272500a4-f2b6-45b4-82a2-943a1e8d7130	f
6b1f32a6-292b-45c4-b725-10fb9151887c	Anardana Goli (Shadani)	2026-03-26 16:37:30.149	SH000001	\N	t	2026-03-26 16:37:30.149	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d51e5c0d-32b9-4e96-b273-c0fb9600cb08	Chatpati Imli (Shadani)	2026-03-26 16:37:30.149	SH000001	\N	t	2026-03-26 16:37:30.149	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d21a7712-fa9b-4812-8b4f-176e63fb479d	Elaichi Barfi	2026-03-26 16:37:30.15	SH000001	\N	t	2026-03-26 16:37:30.15	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
5fb3b2a5-e1fd-477a-8473-b938da517956	Besan Barfi	2026-03-26 16:37:30.15	SH000001	\N	t	2026-03-26 16:37:30.15	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
d57daa7a-87fe-4ca0-8afa-31e5da5f85d8	Chocolate Barfi	2026-03-26 16:37:30.15	SH000001	\N	t	2026-03-26 16:37:30.15	f6460f7b-173d-426b-93d8-2b3587e7147d	f
d8f6a1f8-7fc5-4b0b-883b-f2f07fc4a534	Bundi Laddu (Ghee)	2026-03-26 16:37:30.151	SH000001	\N	t	2026-03-26 16:37:30.151	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
805a2a1e-31a0-4624-a4aa-036f2e8c94e1	Bundi Laddu (Dalda)	2026-03-26 16:37:30.151	SH000001	\N	t	2026-03-26 16:37:30.151	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
a2e2162d-2b1b-4075-8107-30d989ac6eee	Besan Laddu (Ghee)	2026-03-26 16:37:30.151	SH000001	\N	t	2026-03-26 16:37:30.151	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
6133e8b1-5077-4953-9438-adeb72824336	Mixture (Loose)	2026-03-26 16:37:30.152	SH000001	\N	t	2026-03-26 16:37:30.152	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
886ac1c5-e2db-4ad6-9542-6cac7302cb44	Jaggery (Gur)	2026-03-26 16:37:30.152	SH000001	\N	t	2026-03-26 16:37:30.152	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e4c0e7a7-8807-426c-837e-6285c2c95f4e	Liquid Jaggery	2026-03-26 16:37:30.152	SH000001	\N	t	2026-03-26 16:37:30.152	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
059cec99-8f4a-4523-a3e8-dedbc4eb625a	Pista Cookies	2026-03-26 16:37:30.153	SH000001	\N	t	2026-03-26 16:37:30.153	87524c0b-deea-4a33-95f7-216647a0ef8f	f
f2a6bca5-7363-43fd-a7fc-d11901877fab	Lays Chips	2026-03-26 16:37:30.153	SH000001	\N	t	2026-03-26 16:37:30.153	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
ecaf0a02-f0cc-4c26-b0df-1efcd0d87ac8	Thandai (Guruji)	2026-03-26 16:37:30.153	SH000001	\N	t	2026-03-26 16:37:30.153	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
404c1051-7e78-4c97-83c3-977d8865932e	Jaljira (Jalani)	2026-03-26 16:37:30.153	SH000001	\N	t	2026-03-26 16:37:30.153	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
99ebecf5-24c4-470a-b443-88d791da357a	Decha Green	2026-03-26 16:37:30.154	SH000001	\N	t	2026-03-26 16:37:30.154	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
80ee3ebd-731b-452d-b0c5-1f15b1fc0543	Decha Red	2026-03-26 16:37:30.154	SH000001	\N	t	2026-03-26 16:37:30.154	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
981ec52e-b647-4330-ad57-a4aaeb1beb7e	Nariyal Pera	2026-03-26 16:37:30.154	SH000001	\N	t	2026-03-26 16:37:30.154	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
2cd1e4b0-5a18-4fd8-9039-b984c83aea10	Atta Khasta	2026-03-26 16:37:30.155	SH000001	\N	t	2026-03-26 16:37:30.155	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
97eb351d-8ad5-4887-ad48-d4d87a05cb00	Maida Khasta	2026-03-26 16:37:30.155	SH000001	\N	t	2026-03-26 16:37:30.155	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e2327aab-5589-4c2f-b8ed-aecad64c2494	Mitha Saloni	2026-03-26 16:37:30.155	SH000001	\N	t	2026-03-26 16:37:30.155	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
1ef66db8-8117-45e2-94ed-0945106a0dec	Banana Chips	2026-03-26 16:37:30.156	SH000001	\N	t	2026-03-26 16:37:30.156	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
77aa6a3d-802b-4a85-a6e6-b6bf86abde31	Karela Chips	2026-03-26 16:37:30.156	SH000001	\N	t	2026-03-26 16:37:30.156	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
7830f5b1-acb9-4ed9-9fda-3a8017286c5f	Potato Chips	2026-03-26 16:37:30.156	SH000001	\N	t	2026-03-26 16:37:30.156	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
403a4bb2-aa5e-4c01-9359-2005df64a4aa	Kachori	2026-03-26 16:37:30.156	SH000001	\N	t	2026-03-26 16:37:30.156	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
b595104c-3ba3-44a0-aa34-e4f233098c6f	Chakoli	2026-03-26 16:37:30.157	SH000001	\N	t	2026-03-26 16:37:30.157	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
59910763-7087-4f02-851c-0087fba0ad9e	Bhakarwadi 1 Packet	2026-03-26 16:37:30.157	SH000001	\N	t	2026-03-26 16:37:30.157	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
f35d81ca-e15b-4931-9e90-8fb3168406c5	Falahari Mixture	2026-03-26 16:37:30.157	SH000001	\N	t	2026-03-26 16:37:30.157	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
d3aed07d-3e44-4d5a-9895-7b00c28ffa05	Gupchup	2026-03-26 16:37:30.157	SH000001	\N	t	2026-03-26 16:37:30.157	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
07b246fb-379f-4e6b-a0f5-48cebc2f5f38	Haldiram Khata Meetha	2026-03-26 16:37:30.158	SH000001	\N	t	2026-03-26 16:37:30.158	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
69a247c9-ea64-409d-874f-2ea1a39f42c3	All in One Mixture	2026-03-26 16:37:30.158	SH000001	\N	t	2026-03-26 16:37:30.158	ab36cb8b-d194-4f1c-bec5-975402e647d2	f
cda414f0-651e-4259-8b71-ac49b408f588	Panchratan Mix	2026-03-26 16:37:30.158	SH000001	\N	t	2026-03-26 16:37:30.158	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
e8dfaee8-7e1f-49b6-ad72-21b66c42a1b6	Haldiram Soan Papdi	2026-03-26 16:37:30.158	SH000001	\N	t	2026-03-26 16:37:30.158	4a481bd3-903b-45bb-ba9e-b0af86ccd232	f
985118fd-6fd4-4da5-b5a4-38eec4fb6d53	Chole Samosa	2026-03-29 08:10:26.599	SH000001	\N	t	2026-03-29 08:10:26.599	e47bee42-83c0-4e2a-8752-72bcb6d423bd	f
2a305222-fa47-4d44-adf1-764249892dbb	Ajwain Cookies	2026-03-26 16:37:30.122	SH000001		t	2026-04-03 18:44:52.281	9eaa0cfe-e6ab-4784-b3a8-426f0f3ca501	t
0ffb8812-c278-4f87-93e7-f0316d5aba5b	7UP	2026-03-26 16:37:30.074	SH000001		t	2026-04-09 17:19:00.413	4a481bd3-903b-45bb-ba9e-b0af86ccd232	t
\.


--
-- Data for Name: ProductImage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductImage" (id, url, "productId", "createdAt") FROM stdin;
\.


--
-- Data for Name: ProductVariant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ProductVariant" (id, "productId", name, price, "costPrice", barcode, sku, "hsnCode", quantity, "minStock", unit, "createdAt", "updatedAt") FROM stdin;
7a9b7dbc-b0a7-4d97-83d3-b9bd16859f58	2a305222-fa47-4d44-adf1-764249892dbb	Regular	115	\N	CS000594	\N	1905	100	\N	PC	2026-03-26 16:37:30.122	2026-04-03 18:44:52.281
37efbc91-3e02-4a76-b981-effb1d676f32	0ffb8812-c278-4f87-93e7-f0316d5aba5b	250ml	20	\N	CS000450	\N	2202	99	\N	PC	2026-03-26 16:37:30.074	2026-04-03 18:51:29.195
3c397e3a-fc85-4479-af44-fed8d5ab01b3	0ffb8812-c278-4f87-93e7-f0316d5aba5b	750ml	40	\N	CS000452	\N	2202	99	\N	PC	2026-03-26 16:37:30.074	2026-04-09 17:19:00.413
7644fef9-5132-4052-8384-d610e05bfe88	dd66d465-c933-42bb-9683-abb0c3e3f22e	250g	170	\N	CS000083	\N	2106	100	\N	PC	2026-03-26 16:35:55.506	2026-03-26 16:35:55.506
54f26440-d0b3-4f0f-83cc-91c41473af52	a282a1fc-e573-4ebe-b3be-c1f0ad1b17cf	250g	160	\N	CS000055	\N	1904	100	\N	PC	2026-03-26 16:35:55.495	2026-03-26 16:35:55.495
d1964245-0c09-4457-8e04-ee097aabcacb	73aa2c2a-03cf-4d84-b586-890586bb8089	250g	260	\N	CS000056	\N	1904	100	\N	PC	2026-03-26 16:35:55.496	2026-03-26 16:35:55.496
9a8a6875-2d31-46e6-964a-ab8cd1f2a3c4	a88a042d-5ebe-44ab-80e4-b5b3da50a83e	400g	400	\N	CS000057	\N	1904	100	\N	PC	2026-03-26 16:35:55.496	2026-03-26 16:35:55.496
dd324077-f147-41a9-89da-211486be78d8	4e1fa108-0dda-4fc0-be09-567777ea751a	500g	450	\N	CS000058	\N	1904	100	\N	PC	2026-03-26 16:35:55.497	2026-03-26 16:35:55.497
2c6b14fa-8d49-4c1f-9bef-2937038d963f	4cd98a5c-c9a6-49be-b824-1e89031a473e	250g	380	\N	CS000059	\N	1904	100	\N	PC	2026-03-26 16:35:55.497	2026-03-26 16:35:55.497
5592e4d9-4ef5-4a69-ae0d-b5894b395bd1	e1bba730-935b-4b88-910e-0c67549793f6	400g	187	\N	CS000445	\N	2106	100	\N	PC	2026-03-26 16:37:30.072	2026-03-26 16:37:30.072
8e3d8679-ba35-49fe-94e4-187b81786898	15b48427-6b2d-4965-8f73-c51c4e288e37	Regular	117	\N	CS000486	\N	2202	100	\N	PC	2026-03-26 16:37:30.088	2026-03-26 16:37:30.088
cbfd6164-ff92-4468-b206-c052bb2ed73f	cc2d59c2-463f-4891-bcea-cbe61ff57ed7	200g	60	\N	CS000487	\N	2106	100	\N	PC	2026-03-26 16:37:30.088	2026-03-26 16:37:30.088
9263b990-6cab-4095-af39-91809512d938	dcde687c-d40d-4fa8-a307-07de98ec70f1	250g	50	\N	CS000253	\N	2106	100	\N	PC	2026-03-26 16:35:55.561	2026-03-26 16:35:55.561
914d8bf9-515c-4b69-b0b8-3507c7772900	01d95304-5f3c-443e-9b2d-9c9cdff2e800	Regular	40	\N	CS000005	\N	2201	100	\N	PC	2026-03-26 16:35:55.467	2026-03-26 16:35:55.467
82bc8747-70a0-4d38-8c9d-70a1f232f4a4	01d95304-5f3c-443e-9b2d-9c9cdff2e800	125ml	10	\N	CS000006	\N	2202	100	\N	PC	2026-03-26 16:35:55.467	2026-03-26 16:35:55.467
560cc5c7-990f-434b-8383-272861470218	985118fd-6fd4-4da5-b5a4-38eec4fb6d53	Regular	30	\N	CS000001	\N	\N	12	\N	PC	2026-03-29 08:10:26.599	2026-04-03 09:49:50.809
4dc239fa-3d1f-4ee7-83ef-9350141ac3b1	7fb38b95-32ba-43b9-a050-cc71ec4d7005	Regular	280	\N	CS000002	\N	2106	20	\N	KG	2026-03-26 16:35:55.463	2026-03-26 16:35:55.463
72f710bd-364c-449e-87b2-dc9a4d54dc4c	4efc2e74-2d2f-46f8-9e52-24b01cc8b1bf	Regular	240	\N	CS000003	\N	2106	20	\N	KG	2026-03-26 16:35:55.465	2026-03-26 16:35:55.465
47254161-e25e-4bed-b529-56982e49638c	1f97f5d4-9211-460c-8ba1-087e6e5162a4	Regular	55	\N	CS000004	\N	2106	20	\N	KG	2026-03-26 16:35:55.466	2026-03-26 16:35:55.466
c240efd2-326d-4601-9e05-952511ca9347	01d95304-5f3c-443e-9b2d-9c9cdff2e800	Regular	20	\N	CS000007	\N	2202	100	\N	PC	2026-03-26 16:35:55.468	2026-03-26 16:35:55.468
4cd8ddc5-5dd0-48e2-85be-d23b5efecceb	12c2eb0f-7372-4531-8bc9-2a1481313476	Regular	1600	\N	CS000008	\N	2106	20	\N	KG	2026-03-26 16:35:55.468	2026-03-26 16:35:55.468
1a8c52e7-0147-48ef-a598-f4ff83bd8c4a	f72008d8-69c5-4b3f-9c93-63e80cc92dc0	Regular	80	\N	CS000009	\N	2106	20	\N	KG	2026-03-26 16:35:55.469	2026-03-26 16:35:55.469
3e2c873d-fc08-4e01-b9a5-3988292ff92a	534326d2-3d36-43e3-8806-787909471742	1l	108	\N	CS000010	\N	2201	100	\N	PC	2026-03-26 16:35:55.47	2026-03-26 16:35:55.47
79a66de7-2482-41fb-bdbf-b9f5a69ecd9e	be9cfde8-628b-4660-8527-20006327d109	1l	130	\N	CS000011	\N	2201	100	\N	PC	2026-03-26 16:35:55.471	2026-03-26 16:35:55.471
71aa43a8-4404-4ecb-b317-166c9a024fbe	9f524dfc-72ab-426f-9a20-2ab6e3e28d22	200g	40	\N	CS000012	\N	2106	100	\N	PC	2026-03-26 16:35:55.472	2026-03-26 16:35:55.472
0809362b-cd21-4dd0-bddb-a5ff162964f3	83852843-2dfd-4bc5-8f5d-a71a69de3c8f	250g	290	\N	CS000013	\N	2106	100	\N	PC	2026-03-26 16:35:55.472	2026-03-26 16:35:55.472
60de49fb-214e-402d-ab06-f761adfa5645	61be9074-9541-4a1e-97d1-da191e15c836	150g	40	\N	CS000014	\N	2106	100	\N	PC	2026-03-26 16:35:55.473	2026-03-26 16:35:55.473
e9949b35-153f-4c48-bb17-8cfacde95523	ccd867a1-93a2-4d57-b38e-43c49399eee6	200g	30	\N	CS000015	\N	2106	100	\N	PC	2026-03-26 16:35:55.473	2026-03-26 16:35:55.473
62926cab-e7ad-4bc6-bb6e-1ce93bc459cc	9b7f73ee-4c37-49df-96ec-b9d9c3ac0575	Regular	25	\N	CS000016	\N	2106	100	\N	PC	2026-03-26 16:35:55.474	2026-03-26 16:35:55.474
37fa5806-a80f-45fd-811b-da212986e571	aae7f7e6-02e0-4b67-aece-f56358a57fe4	200g	40	\N	CS000017	\N	2106	100	\N	PC	2026-03-26 16:35:55.475	2026-03-26 16:35:55.475
5657614c-3811-4bef-9dbd-b6af8555ee8e	9766fbfc-1f0e-4922-9b8e-52862957b8d6	180g	20	\N	CS000018	\N	2106	100	\N	PC	2026-03-26 16:35:55.475	2026-03-26 16:35:55.475
9a84441d-f15e-4f9c-8f74-6aff3bebe16f	73446396-8254-41af-8c59-a91241689d6d	200g	40	\N	CS000019	\N	2106	100	\N	PC	2026-03-26 16:35:55.476	2026-03-26 16:35:55.476
5528e5da-62a1-441b-a25e-9d2217371607	4350d569-fcf0-4966-a8b8-62e33e06c331	200g	70	\N	CS000020	\N	2106	100	\N	PC	2026-03-26 16:35:55.476	2026-03-26 16:35:55.476
8c209f92-a976-485a-ae06-503856fdd946	50187c9e-e900-4ff5-b61a-e052223a0d35	125g	100	\N	CS000021	\N	2106	100	\N	PC	2026-03-26 16:35:55.477	2026-03-26 16:35:55.477
fc8ff7dc-e32e-4a03-b031-05b42e1603ee	2db44cfa-63ca-4ece-85bd-532496d214b3	150g	35	\N	CS000022	\N	2106	100	\N	PC	2026-03-26 16:35:55.478	2026-03-26 16:35:55.478
985314df-f866-4585-ba62-20f50365207a	19a64801-d521-49d1-9eff-5c8b54c61dd9	150g	35	\N	CS000023	\N	2106	100	\N	PC	2026-03-26 16:35:55.478	2026-03-26 16:35:55.478
32b2822d-59b6-4f61-86cc-639d13f9270b	8e7df81a-b0f7-4d08-9887-486442cb9304	194g	30	\N	CS000024	\N	2106	100	\N	PC	2026-03-26 16:35:55.479	2026-03-26 16:35:55.479
37ba0542-6cbd-48d8-9aed-54cffab78a5b	7901c892-08b8-4051-b07e-9803fc39968a	200g	30	\N	CS000025	\N	2106	100	\N	PC	2026-03-26 16:35:55.479	2026-03-26 16:35:55.479
26ba32e7-d950-40da-b057-6bc878b102d9	7ba13e8a-7cb0-401f-8c28-2692c6d8798b	250g	130	\N	CS000026	\N	2106	100	\N	PC	2026-03-26 16:35:55.48	2026-03-26 16:35:55.48
8b13bc0b-3c76-4297-a6d2-2ae37a1e4a1c	7e5979d1-9a9a-4112-87a0-4d3add571131	250g	110	\N	CS000027	\N	2106	100	\N	PC	2026-03-26 16:35:55.481	2026-03-26 16:35:55.481
d188e4bc-e716-4c11-b14e-c350386ad3e4	ab83095f-012f-4afd-8c8b-0210a3b3091f	Regular	110	\N	CS000028	\N	2106	20	\N	KG	2026-03-26 16:35:55.482	2026-03-26 16:35:55.482
ac0f8b9d-d362-4a7a-9b5a-2036e492ba3a	90b5fa08-bd28-4b3a-b6ab-a29c7cc2f6b6	250g	155	\N	CS000029	\N	2106	100	\N	PC	2026-03-26 16:35:55.483	2026-03-26 16:35:55.483
16bd4009-0978-43a1-a1e6-3ecab9efdea8	0b5a5ad9-2c7f-4ed9-9d8e-597e4bd838ba	250g	150	\N	CS000030	\N	2106	100	\N	PC	2026-03-26 16:35:55.483	2026-03-26 16:35:55.483
e38ff694-f411-4a84-a943-e9c6ff71b226	60d46770-3d2e-43d8-9cf0-df3337a6ef47	Regular	20	\N	CS000031	\N	2202	100	\N	PC	2026-03-26 16:35:55.483	2026-03-26 16:35:55.483
bbc636a1-3be7-4d93-803e-055d265785b9	58182e93-205c-4226-bd5a-c3403c19cb28	2L	100	\N	CS000032	\N	2202	100	\N	PC	2026-03-26 16:35:55.484	2026-03-26 16:35:55.484
3f3fde41-765b-4854-8858-2645a51cb8e7	342845d1-d938-4015-8f59-6d7a4c57ac49	1L	130	\N	CS000033	\N	2202	100	\N	PC	2026-03-26 16:35:55.485	2026-03-26 16:35:55.485
948eaec4-7bf7-41a1-9470-5dfe132cbd1d	321019fc-417c-40bc-af83-e291583cec60	700ml	300	\N	CS000034	\N	2105	100	\N	PC	2026-03-26 16:35:55.486	2026-03-26 16:35:55.486
bfc2fa16-f215-4d82-8ba3-27459f0c5d8f	ac2749be-178d-4ce4-a5ca-0ec793096131	750ml	280	\N	CS000035	\N	2105	100	\N	PC	2026-03-26 16:35:55.486	2026-03-26 16:35:55.486
8458f360-baa3-4a69-947f-932821f8dfd8	7329732c-9efe-4a37-ba32-0f70df660e64	Regular	350	\N	CS000036	\N	2105	100	\N	PC	2026-03-26 16:35:55.487	2026-03-26 16:35:55.487
41ccb63e-0673-4d35-b5b2-3c31b4b484d7	9163d4f7-e13b-40ae-86ce-c48d1fe25da9	Regular	240	\N	CS000037	\N	2106	20	\N	KG	2026-03-26 16:35:55.487	2026-03-26 16:35:55.487
7060a941-e315-4a0b-a95b-f7fc1fd03c4b	d3b8cba1-db1d-42da-af54-41845210d5f5	400g	120	\N	CS000038	\N	2106	100	\N	PC	2026-03-26 16:35:55.488	2026-03-26 16:35:55.488
41d6f9b7-0370-4a51-a4da-2f1b406414b8	d3b8cba1-db1d-42da-af54-41845210d5f5	200g	60	\N	CS000039	\N	2106	100	\N	PC	2026-03-26 16:35:55.488	2026-03-26 16:35:55.488
0cf461e2-9b26-4a87-9a61-4b02314e78eb	b9d03f30-c42e-45ed-a116-9a81438f459e	400g	120	\N	CS000040	\N	2106	100	\N	PC	2026-03-26 16:35:55.489	2026-03-26 16:35:55.489
59574994-2f3c-49ec-99b6-a425e6278d8f	b9d03f30-c42e-45ed-a116-9a81438f459e	200g	60	\N	CS000041	\N	2106	100	\N	PC	2026-03-26 16:35:55.489	2026-03-26 16:35:55.489
9df6c8f9-351e-43f9-a898-f741e7d5620c	b37c1ebb-e1e2-4587-b929-49e074578123	Regular	800	\N	CS000042	\N	2106	20	\N	KG	2026-03-26 16:35:55.489	2026-03-26 16:35:55.489
f533b446-32d6-4a5b-a04d-fe73d4f3e0a1	677a2d44-c91e-43dd-8b64-a867778bdead	Regular	300	\N	CS000043	\N	2106	20	\N	KG	2026-03-26 16:35:55.49	2026-03-26 16:35:55.49
5d68f624-7ed4-42cd-a471-b19ff98ac98a	870f6833-6635-419f-856b-5342c1802b3e	Regular	850	\N	CS000044	\N	2106	20	\N	KG	2026-03-26 16:35:55.49	2026-03-26 16:35:55.49
59916c0e-f3b5-4b56-85a8-04d8e0af88cc	930dfc0c-f967-4633-b5d5-4674191ad511	Regular	220	\N	CS000045	\N	2106	20	\N	KG	2026-03-26 16:35:55.491	2026-03-26 16:35:55.491
d00ba9a4-dec9-4bba-a7a8-7c1bb1a62c2b	662b6b71-9c40-4e39-86e8-175557d3c5db	Regular	130	\N	CS000046	\N	2106	20	\N	KG	2026-03-26 16:35:55.491	2026-03-26 16:35:55.491
7978689f-0c6e-4c6e-8cd6-f8dc39c49660	d115d5dc-9b79-4cc2-8a2b-5e0bdca3da93	250g	60	\N	CS000047	\N	2106	100	\N	PC	2026-03-26 16:35:55.492	2026-03-26 16:35:55.492
c3f4ca31-4fe8-45db-b394-e228c7dadbca	5153dcae-ff49-4da2-a28b-edfe29d4c9bc	Regular	60	\N	CS000048	\N	2106	100	\N	PC	2026-03-26 16:35:55.492	2026-03-26 16:35:55.492
2d90ec97-1278-4814-89a3-32918cca3e58	527d8a95-3dee-4a7d-b26d-f662dd0b121f	400g	135	\N	CS000049	\N	2106	100	\N	PC	2026-03-26 16:35:55.493	2026-03-26 16:35:55.493
eede8ed6-39f2-4077-8e98-978e020fc7a7	9999c195-23ca-4472-b709-7f9f279b2660	Regular	20	\N	CS000050	\N	2106	100	\N	PC	2026-03-26 16:35:55.493	2026-03-26 16:35:55.493
0de1028a-5b2f-4d7f-9406-f8769d3b325b	6fd4ea8c-310e-4d8c-a496-a5ad65605f39	Regular	300	\N	CS000051	\N	2106	20	\N	KG	2026-03-26 16:35:55.494	2026-03-26 16:35:55.494
4fe173c3-83c1-4050-96f4-0b707168b499	b7e978c1-d1dc-4417-bbbf-64774991f620	Regular	480	\N	CS000052	\N	2106	20	\N	KG	2026-03-26 16:35:55.494	2026-03-26 16:35:55.494
3bb14967-e34a-445a-8ca0-bdc8728cc8c1	f56314dd-8819-45b5-ab76-54ae0cb9383e	Regular	440	\N	CS000053	\N	2106	20	\N	KG	2026-03-26 16:35:55.494	2026-03-26 16:35:55.494
80fcfb6e-4a68-42f7-9c29-64c0e5cbe6a9	0d277a24-bb8d-4235-8488-d731cce10ae5	250g	550	\N	CS000054	\N	1904	100	\N	PC	2026-03-26 16:35:55.495	2026-03-26 16:35:55.495
10b03f7c-2a20-401e-8c3c-8ee57dd1e5f8	e3cab25a-727d-4227-8e90-6ac07e353cb3	Regular	10	\N	CS000060	\N	2105	100	\N	PC	2026-03-26 16:35:55.497	2026-03-26 16:35:55.497
954d5994-80c0-410a-bd72-b9b8b5fa5042	a2fccf46-c2b8-443f-a6a1-10001ec2433c	Regular	10	\N	CS000061	\N	2105	100	\N	PC	2026-03-26 16:35:55.498	2026-03-26 16:35:55.498
bb6049ca-824b-4b88-b4b1-e53e6bd6c365	1a2f813a-0090-47a8-a0a3-e984405a52a2	Regular	35	\N	CS000062	\N	2105	100	\N	PC	2026-03-26 16:35:55.498	2026-03-26 16:35:55.498
e26b833f-2814-48ee-a387-69d24d340fac	8039710d-b184-4ac8-ae10-6ddeb84b26e7	Regular	40	\N	CS000063	\N	2105	100	\N	PC	2026-03-26 16:35:55.499	2026-03-26 16:35:55.499
d7f1d187-de9b-4881-b95a-a014a36b4c1c	1e7c8e33-9fdb-4305-833c-ba67cff6f0f7	Regular	50	\N	CS000064	\N	2105	100	\N	PC	2026-03-26 16:35:55.499	2026-03-26 16:35:55.499
3481d175-7e22-4fc1-bcc9-589e5b2ce971	64664d68-be41-4041-99ca-ad150e309d38	Regular	600	\N	CS000065	\N	2106	20	\N	KG	2026-03-26 16:35:55.5	2026-03-26 16:35:55.5
8e80d41a-6cec-4ec3-acb6-dc18f5903df9	cee39dd5-72c6-48ea-9ba4-6a109951f408	Regular	400	\N	CS000066	\N	2106	20	\N	KG	2026-03-26 16:35:55.5	2026-03-26 16:35:55.5
6e17274e-8096-4079-94fa-12a71913ce7e	83bd82af-fec1-455d-86ee-4b2ce9103944	Regular	35	\N	CS000067	\N	996331	100	\N	PC	2026-03-26 16:35:55.5	2026-03-26 16:35:55.5
4f6303ff-7cff-4bb4-bf41-6ee308195567	134f0029-7918-4361-80a5-9b14d7e2efbb	Regular	640	\N	CS000068	\N	2106	20	\N	KG	2026-03-26 16:35:55.501	2026-03-26 16:35:55.501
45afb543-011e-4ca2-ae98-3914a27e2cf7	d9d9ef2f-1d87-4e9a-be4d-26db37c99521	Regular	82	\N	CS000069	\N	2106	100	\N	PC	2026-03-26 16:35:55.501	2026-03-26 16:35:55.501
10c2255a-7935-485f-82d4-922ffc82e1d0	d9d9ef2f-1d87-4e9a-be4d-26db37c99521	50g	10	\N	CS000070	\N	210690	100	\N	PC	2026-03-26 16:35:55.501	2026-03-26 16:35:55.501
2f6409e7-42a4-45aa-9b48-88c9ee2ba369	0eba5584-0812-4a5d-9822-9bdf731708ad	Regular	1200	\N	CS000071	\N	1904	20	\N	KG	2026-03-26 16:35:55.502	2026-03-26 16:35:55.502
4a7d1095-b9f1-46e5-964b-50f255e2aa05	0eba5584-0812-4a5d-9822-9bdf731708ad	250g	300	\N	CS000072	\N	1904	100	\N	PC	2026-03-26 16:35:55.502	2026-03-26 16:35:55.502
6db64680-dbc5-49f7-b961-780ba5b76d10	1eb72c70-20c8-421a-b296-7ad07cf65cd1	Regular	680	\N	CS000073	\N	2106	20	\N	KG	2026-03-26 16:35:55.502	2026-03-26 16:35:55.502
acaf4b07-4687-46ba-9d25-78109c9e52b5	f24279c9-66a4-4aab-ba0a-7f5e19fbdeea	Regular	680	\N	CS000074	\N	2106	20	\N	KG	2026-03-26 16:35:55.503	2026-03-26 16:35:55.503
d8791e23-4cbc-41ba-b7b3-3649913f30f8	ae3d7b1e-8f09-46c7-864a-016ffc21b7da	Regular	20	\N	CS000075	\N	2106	100	\N	PC	2026-03-26 16:35:55.503	2026-03-26 16:35:55.503
41a6f0ba-7211-43ce-bdbb-28aa66442d4a	cb7beb62-297e-4c23-881f-58d4715162d7	Regular	30	\N	CS000076	\N	996331	100	\N	PC	2026-03-26 16:35:55.504	2026-03-26 16:35:55.504
c5a18947-99c1-4830-abf8-22cacfb56faf	4ed03c40-5936-4130-a159-9a36a6f0b3ba	Regular	30	\N	CS000077	\N	996331	100	\N	PC	2026-03-26 16:35:55.504	2026-03-26 16:35:55.504
17b6ba32-61df-42c9-addb-26a8a4cd327a	545540b4-b85d-40fa-b545-cbac55a8f1f3	Regular	20	\N	CS000078	\N	996331	100	\N	PC	2026-03-26 16:35:55.504	2026-03-26 16:35:55.504
e9e7df0f-c893-415e-ac34-4e1c8956ef72	0ae27b61-ccde-45a8-9c06-0f91ef0f6977	Regular	95	\N	CS000079	\N	2106	100	\N	PC	2026-03-26 16:35:55.505	2026-03-26 16:35:55.505
4b3c9d14-8a60-4736-83b7-4030c1572bbd	3056c13d-b237-40b0-91b6-11964d0b9a76	Regular	80	\N	CS000080	\N	2106	100	\N	PC	2026-03-26 16:35:55.505	2026-03-26 16:35:55.505
db168714-7c27-42d7-a579-15ab218756e5	0bf76ae0-73a4-4d0c-9f27-663d15a1ce50	250g	180	\N	CS000081	\N	2106	100	\N	PC	2026-03-26 16:35:55.506	2026-03-26 16:35:55.506
c22359f6-4e25-4a99-a3dc-bf47c8e8fad6	aad10ad0-a0c0-4c97-ac3e-3eefdd567e09	250g	170	\N	CS000082	\N	2106	100	\N	PC	2026-03-26 16:35:55.506	2026-03-26 16:35:55.506
2f8b5896-fd80-4fff-b25e-d1d46db29a0f	2362e01a-8a63-41a6-9cee-4300bba500eb	200g	90	\N	CS000084	\N	2106	100	\N	PC	2026-03-26 16:35:55.507	2026-03-26 16:35:55.507
2fa91b11-8911-4604-9250-25a12fe0a4fe	2f4222db-821a-4a71-bf8e-8d7ad9ea1743	500g	175	\N	CS000085	\N	2106	100	\N	PC	2026-03-26 16:35:55.508	2026-03-26 16:35:55.508
55161551-fe51-492b-a541-277c4434c815	2f4222db-821a-4a71-bf8e-8d7ad9ea1743	100g	46	\N	CS000086	\N	2106	100	\N	PC	2026-03-26 16:35:55.508	2026-03-26 16:35:55.508
9bab010e-d3ad-46e4-aaec-094dc9dc1435	d98e04cd-17c9-4b4d-97ad-248435dddeb1	400g	160	\N	CS000087	\N	2106	100	\N	PC	2026-03-26 16:35:55.508	2026-03-26 16:35:55.508
fac2dcac-678c-48e9-807f-0ae185c9406e	fc44a2db-1d64-426f-95a0-96a97c2cc251	400g	187	\N	CS000088	\N	2106	100	\N	PC	2026-03-26 16:35:55.508	2026-03-26 16:35:55.508
8497a3bb-013d-442e-b704-b251e54bf9c0	142988ec-a58c-4580-85e1-be42e1020a8b	400ml	20	\N	CS000089	\N	2202	100	\N	PC	2026-03-26 16:35:55.509	2026-03-26 16:35:55.509
afe2655d-c1a9-447d-913c-9cb65087dda6	78c4d48d-e19e-4ceb-9979-e6f18ee6546b	400g	235	\N	CS000090	\N	2106	100	\N	PC	2026-03-26 16:35:55.509	2026-03-26 16:35:55.509
81b63502-eabe-4789-ab5c-32374e50cfc1	142988ec-a58c-4580-85e1-be42e1020a8b	750ml	40	\N	CS000091	\N	2202	100	\N	PC	2026-03-26 16:35:55.509	2026-03-26 16:35:55.509
94a5629c-72e3-4fa8-9469-43fe41ba6419	b2efdb92-7d6b-4134-b579-0cc15a266b92	250ml	20	\N	CS000092	\N	2202	99	\N	PC	2026-03-26 16:35:55.51	2026-03-29 08:42:42.423
75b591a2-88d1-4604-9ea0-dc957948a3a6	b2efdb92-7d6b-4134-b579-0cc15a266b92	750ml	40	\N	CS000093	\N	2202	100	\N	PC	2026-03-26 16:35:55.51	2026-03-26 16:35:55.51
8c54ed5a-45f3-4fce-9edd-59a1da19f092	83c60713-774b-464a-9594-b0de2a809225	25L	100	\N	CS000094	\N	2202	100	\N	PC	2026-03-26 16:35:55.51	2026-03-26 16:35:55.51
3b86c355-bbf7-49c4-8f6c-533491557f94	e7b34425-4b36-4a8a-9829-0bf3a3f6b7a2	Regular	180	\N	CS000095	\N	2106	100	\N	PC	2026-03-26 16:35:55.511	2026-03-26 16:35:55.511
c195dbf0-b435-46cb-a51d-f045e66f3b41	c91ba766-4424-46e4-b77a-6690d2173465	25L	90	\N	CS000096	\N	2202	100	\N	PC	2026-03-26 16:35:55.511	2026-03-26 16:35:55.511
f58f4b88-3182-4eee-85a0-cb0aa87e16ba	a7addcba-0087-473c-8906-a623c30d8c49	200ml	30	\N	CS000097	\N	2202	100	\N	PC	2026-03-26 16:35:55.511	2026-03-26 16:35:55.511
ca4796da-98cc-4a83-9003-a7866b94a1b5	1929a096-46d2-45b2-b1eb-d6a83823fda1	Regular	60	\N	CS000098	\N	1905	100	\N	PC	2026-03-26 16:35:55.512	2026-03-26 16:35:55.512
d3840bf6-defa-4a52-ad19-782f8f545867	70f2879c-0594-44ab-ab6e-8149b7489854	250g	130	\N	CS000099	\N	2106	100	\N	PC	2026-03-26 16:35:55.512	2026-03-26 16:35:55.512
8ef0a51d-95b1-4bb9-a3b9-20f4fc78cc85	c9e05acf-b468-4960-9ef2-3b2135ea9eb8	400g	220	\N	CS000100	\N	1905	100	\N	PC	2026-03-26 16:35:55.512	2026-03-26 16:35:55.512
4127b030-fd5b-40c9-9430-07a87d266a1d	c44a7b98-352a-4960-b5c0-7d9aa5b19381	250g	105	\N	CS000101	\N	2106	100	\N	PC	2026-03-26 16:35:55.513	2026-03-26 16:35:55.513
62701eff-cc8e-4c95-9d8f-1df0db113a3c	c477445e-fd29-47da-82a3-281b1afa4634	250g	40	\N	CS000102	\N	2106	100	\N	PC	2026-03-26 16:35:55.513	2026-03-26 16:35:55.513
47b89bcf-3a51-4f90-9ac8-7c3a59734257	dc41edad-8e24-4804-be56-656b1708408b	250g	40	\N	CS000103	\N	2106	100	\N	PC	2026-03-26 16:35:55.513	2026-03-26 16:35:55.513
6ca69778-f273-45ea-9865-d9a5c6e93db3	4bbfecee-eb6f-4249-ad3b-c745b2685f32	400g	85	\N	CS000104	\N	2106	100	\N	PC	2026-03-26 16:35:55.514	2026-03-26 16:35:55.514
949bdf49-7b2d-4891-ac4c-f2fd6ebe0471	04adc3de-3e92-416d-890c-667f1b2a1bb9	Regular	50	\N	CS000105	\N	2105	100	\N	PC	2026-03-26 16:35:55.514	2026-03-26 16:35:55.514
15700832-5fd4-4228-ac15-105e6e997e10	654ef87b-0873-41eb-b340-439619145794	Regular	30	\N	CS000106	\N	2105	100	\N	PC	2026-03-26 16:35:55.515	2026-03-26 16:35:55.515
48d47af6-11b3-4d1d-9866-659260d1e2ba	b6b6add3-8cd1-4be4-b01b-d5efe7e26b74	Regular	50	\N	CS000107	\N	2105	100	\N	PC	2026-03-26 16:35:55.515	2026-03-26 16:35:55.515
16ba24eb-8a84-4a29-8b2a-45ce560843a1	fd74aa8c-b8e0-4974-b602-050721d183ce	Regular	35	\N	CS000108	\N	2105	100	\N	PC	2026-03-26 16:35:55.516	2026-03-26 16:35:55.516
ce5369f2-0f7f-41ed-a01c-95059da5ef81	f8d8fbd8-ba97-4996-9904-9e7252b6be7d	Regular	60	\N	CS000109	\N	2105	100	\N	PC	2026-03-26 16:35:55.516	2026-03-26 16:35:55.516
2e784af6-40f8-4dc7-9979-bdc7b08490ba	5f4ae2e8-6a39-4e3e-8fc4-28bc21a44da7	Regular	115	\N	CS000110	\N	2105	100	\N	PC	2026-03-26 16:35:55.517	2026-03-26 16:35:55.517
5d5dee65-0eec-49e6-8f92-fad1c4137e26	55ec2843-62bd-40bf-a52f-09d486e64a23	120g	95	\N	CS000111	\N	2106	100	\N	PC	2026-03-26 16:35:55.517	2026-03-26 16:35:55.517
fe8c1a97-b7b7-4887-9dbf-22856a107481	0b8b57b8-cfa4-4008-a3ea-bd9b01c28b54	100g	90	\N	CS000112	\N	2106	100	\N	PC	2026-03-26 16:35:55.518	2026-03-26 16:35:55.518
910b5ecc-6aa5-44b0-ad48-0ee0906335d2	c07e6ec6-76d7-4964-9d2c-d9450d3443a7	135g	85	\N	CS000113	\N	2106	100	\N	PC	2026-03-26 16:35:55.518	2026-03-26 16:35:55.518
dba14e8a-49f5-429e-aec1-5f07bfc63456	5a5a3104-b7f8-4401-aef1-a8c4c4296c67	110g	95	\N	CS000114	\N	2106	100	\N	PC	2026-03-26 16:35:55.518	2026-03-26 16:35:55.518
2aa01f77-e168-4afc-819e-8a93cc316dff	8e7b5dff-c523-421c-add5-6382a8208e5b	150g	30	\N	CS000115	\N	2106	100	\N	PC	2026-03-26 16:35:55.519	2026-03-26 16:35:55.519
027559cf-1f9c-4add-8311-542567e6921d	2cc284a3-5fda-44cb-a783-783972b2a002	150g	40	\N	CS000116	\N	2106	100	\N	PC	2026-03-26 16:35:55.519	2026-03-26 16:35:55.519
63e954c1-cd17-4305-b53e-de96fdb14fbb	8c43f74e-c60a-4305-b064-f0302c0d7949	120g	95	\N	CS000117	\N	2106	100	\N	PC	2026-03-26 16:35:55.519	2026-03-26 16:35:55.519
1507bc52-c088-4186-bc3e-a3d556f09ddc	c66b4bb5-4e66-4e59-9085-7c0fa0c6e46e	Regular	340	\N	CS000118	\N	2106	20	\N	KG	2026-03-26 16:35:55.52	2026-03-26 16:35:55.52
1afa3f40-3a5a-4432-a658-f767cec36465	49631276-ccf3-4066-ae59-5c72dfdbee48	200g	57	\N	CS000119	\N	2106	100	\N	PC	2026-03-26 16:35:55.52	2026-03-26 16:35:55.52
f7acc35e-f97e-4a93-8469-fba49e6014de	1be6937d-af4b-4933-b127-c9618e19650c	200g	55	\N	CS000120	\N	2106	100	\N	PC	2026-03-26 16:35:55.52	2026-03-26 16:35:55.52
8d7a181e-f2fa-4c98-854d-48c229f0eb67	38c85eb3-9bb1-4350-ac22-cb602b0a8c54	140g	75	\N	CS000121	\N	2106	100	\N	PC	2026-03-26 16:35:55.521	2026-03-26 16:35:55.521
4907e44c-5d1f-4aaf-b40c-9cf5bc2eee9c	b78ac960-9387-4977-80a1-fff399ee7ba5	Regular	1000	\N	CS000122	\N	2106	20	\N	KG	2026-03-26 16:35:55.521	2026-03-26 16:35:55.521
b42fa362-df11-499b-bc15-e6a2f5883ff8	720292ec-a010-45ad-bd6c-94045b91e988	150g	70	\N	CS000123	\N	2106	100	\N	PC	2026-03-26 16:35:55.521	2026-03-26 16:35:55.521
3d737d27-c997-4e0e-ae4f-082213a01404	1928bb39-5fdd-428f-826a-4dff1ddecd68	Regular	1080	\N	CS000124	\N	2106	20	\N	KG	2026-03-26 16:35:55.522	2026-03-26 16:35:55.522
f3f2f262-dd96-418d-bb21-6e1d7a9e19c1	b99c399d-623f-41e9-af94-0956451e0590	400g	120	\N	CS000125	\N	2106	100	\N	PC	2026-03-26 16:35:55.522	2026-03-26 16:35:55.522
2963b397-9f0b-425c-9928-8606f7ea1896	d48b516b-5ca6-4184-80ca-c8241c783e88	200g	60	\N	CS000126	\N	2106	100	\N	PC	2026-03-26 16:35:55.523	2026-03-26 16:35:55.523
2fc98eea-aba0-4a89-a9c4-18beec6192e8	cc91ba54-ee6f-4a1b-9343-aac8ff19685f	200g	60	\N	CS000127	\N	2106	100	\N	PC	2026-03-26 16:35:55.523	2026-03-26 16:35:55.523
2376b5ad-e610-4dcd-aec6-6db444ce96cd	4daae8ac-4120-4cb8-9126-93231804dd2d	Regular	1480	\N	CS000128	\N	2106	20	\N	KG	2026-03-26 16:35:55.523	2026-03-26 16:35:55.523
2ad98b4d-1cec-4b2e-ad0e-917d71208087	71e50312-0920-42b6-b5c5-daf19099b161	Regular	117	\N	CS000129	\N	2202	100	\N	PC	2026-03-26 16:35:55.524	2026-03-26 16:35:55.524
97b8ccb9-3779-4b83-8d37-d764de20b5fe	09e78e45-2755-47dc-9bf2-4e061717efcc	Regular	122	\N	CS000130	\N	2202	100	\N	PC	2026-03-26 16:35:55.524	2026-03-26 16:35:55.524
39cb5d3f-8318-4008-b1c0-091ec0d74a76	922180dd-ea04-4978-adde-968e2b08f11c	1L	108	\N	CS000131	\N	2202	100	\N	PC	2026-03-26 16:35:55.524	2026-03-26 16:35:55.524
c8b804c6-f572-468c-8872-03545cf85d0e	561b0309-dd96-45b0-8ada-147d218adba3	Regular	112	\N	CS000132	\N	2202	100	\N	PC	2026-03-26 16:35:55.525	2026-03-26 16:35:55.525
229a77fc-8211-4d19-82b4-98254c71fe64	e8fbe411-f472-4b7c-ba1c-df2dfc36bf7b	1L	80	\N	CS000133	\N	2202	100	\N	PC	2026-03-26 16:35:55.525	2026-03-26 16:35:55.525
eb6c5ea0-2ade-419f-8c5f-31c0a250e55b	1af6ff1a-61df-4713-9549-cc14370423c4	59g	20	\N	CS000134	\N	210690	100	\N	PC	2026-03-26 16:35:55.526	2026-03-26 16:35:55.526
f1497756-899a-4697-b538-2faf3609141a	233fe744-cdcd-4fec-a95a-8c13225b4787	100g	20	\N	CS000135	\N	210690	100	\N	PC	2026-03-26 16:35:55.526	2026-03-26 16:35:55.526
52ef7557-0600-45a5-bb52-5227c6e0b7a4	494de6c8-a029-4946-8529-1bb1fae3b45a	98g	20	\N	CS000136	\N	210690	100	\N	PC	2026-03-26 16:35:55.526	2026-03-26 16:35:55.526
ba7253a1-4db0-4bae-bfad-7dcdfbd671fc	d29942ff-195e-445b-9dd3-42d68aabc730	345ml	20	\N	CS000137	\N	2202	100	\N	PC	2026-03-26 16:35:55.527	2026-03-26 16:35:55.527
4b591cfc-345d-4511-8198-ac59051f91ca	e4f1c42e-3f04-4adb-a822-177b52d5bc7f	250ml	125	\N	CS000138	\N	2202	100	\N	PC	2026-03-26 16:35:55.527	2026-03-26 16:35:55.527
d7d99ed8-4dd6-4fc8-9ae3-4092bd79a57e	b36b7c09-ed40-4257-bbf1-4490c4f51d54	59g	20	\N	CS000139	\N	210690	100	\N	PC	2026-03-26 16:35:55.527	2026-03-26 16:35:55.527
5202200d-4bf5-46c1-b719-d7679caeb7cf	47b0240f-2db3-4421-8407-8fd0af8ee7b8	25L	100	\N	CS000140	\N	2202	100	\N	PC	2026-03-26 16:35:55.527	2026-03-26 16:35:55.527
31d5f951-a4ed-4654-8814-edf13a58d68b	708ef27f-127f-45bc-a7ea-12ab81ce6206	180ml	40	\N	CS000141	\N	2202	100	\N	PC	2026-03-26 16:35:55.528	2026-03-26 16:35:55.528
7e9e2953-6c26-4d66-98a4-99149afdf733	dc22a065-2a04-4a11-9d35-dfa43a5d7504	1L	20	\N	CS000142	\N	2201	100	\N	PC	2026-03-26 16:35:55.528	2026-03-26 16:35:55.528
33231ebe-d35f-47ca-a39f-4d842edfdc17	4fe18535-902e-4e32-bfa3-29ae844ed572	250ml	60	\N	CS000143	\N	2202	100	\N	PC	2026-03-26 16:35:55.528	2026-03-26 16:35:55.528
6bd59dfa-3f9e-4481-95f6-4acf9a0b7b3c	dc22a065-2a04-4a11-9d35-dfa43a5d7504	2L	30	\N	CS000144	\N	2201	100	\N	PC	2026-03-26 16:35:55.528	2026-03-26 16:35:55.528
19d197f5-49d0-41e7-8da3-f3feef4c9e9f	dc22a065-2a04-4a11-9d35-dfa43a5d7504	500ml	10	\N	CS000145	\N	2201	100	\N	PC	2026-03-26 16:35:55.529	2026-03-26 16:35:55.529
865bda4f-4a65-41d0-b1e2-02d626b91fcc	dc22a065-2a04-4a11-9d35-dfa43a5d7504	1L	20	\N	CS000146	\N	2201	100	\N	PC	2026-03-26 16:35:55.529	2026-03-26 16:35:55.529
41b7cd62-cb17-49d1-89fd-a9ca8d88cb64	b0cd4556-3b57-4b28-9d24-3c0125b0a21b	Regular	30	\N	CS000147	\N	2106	100	\N	PC	2026-03-26 16:35:55.529	2026-03-26 16:35:55.529
a0c96824-1c48-4613-a4a0-b8fd85f0cb41	dc22a065-2a04-4a11-9d35-dfa43a5d7504	5L	68	\N	CS000148	\N	2201	100	\N	PC	2026-03-26 16:35:55.529	2026-03-26 16:35:55.529
1ae801c3-4b27-45c8-9e58-2c4481f02859	0dd1cba8-f4b3-4bc6-bd3f-1ee2b56fc240	Regular	60	\N	CS000149	\N	2106	100	\N	PC	2026-03-26 16:35:55.529	2026-03-26 16:35:55.529
86dadd86-b765-4f7b-ac99-6b1fe0d6466c	555e22e9-20d9-4f04-8373-ce823d6ee5a2	Regular	35	\N	CS000150	\N	2106	100	\N	PC	2026-03-26 16:35:55.53	2026-03-26 16:35:55.53
d89bccf4-4654-4c34-9488-aef660adfa1c	24f96488-ab4e-412e-a784-b673b87068ae	Regular	60	\N	CS000151	\N	2106	100	\N	PC	2026-03-26 16:35:55.53	2026-03-26 16:35:55.53
dfcc3ced-3e28-4e50-a7ec-15a22762f697	54422095-39f1-4db6-8193-649db38f4cb1	Regular	16	\N	CS000152	\N	2106	100	\N	PC	2026-03-26 16:35:55.53	2026-03-26 16:35:55.53
c7cc8fdc-b53a-48f4-96c0-a1caacdf4982	9602cc4e-83b7-4fed-8ca0-f72fcbde9ba3	Regular	680	\N	CS000153	\N	2106	20	\N	KG	2026-03-26 16:35:55.53	2026-03-26 16:35:55.53
fa4777ea-5f31-4a82-bae1-21d784d2079e	7957c8ed-7315-491c-b7fb-657acfaa76ae	Regular	440	\N	CS000154	\N	2106	20	\N	KG	2026-03-26 16:35:55.531	2026-03-26 16:35:55.531
7d3c095a-6221-4af1-9a18-4b0ed20401b3	cbe137a6-76e9-42c3-badc-37618434d2d6	Regular	640	\N	CS000155	\N	2106	20	\N	KG	2026-03-26 16:35:55.531	2026-03-26 16:35:55.531
4df61c7a-d0ba-4598-a56c-4fd35a9ebd79	8d81988b-62da-4f56-8293-8be97b6e14bb	Regular	640	\N	CS000156	\N	2106	20	\N	KG	2026-03-26 16:35:55.531	2026-03-26 16:35:55.531
0cd5611d-fd4e-4a17-9f6e-00e28f81264e	d5692d07-13a2-4f3a-9a7a-bc12433f5940	Regular	640	\N	CS000157	\N	2106	20	\N	KG	2026-03-26 16:35:55.532	2026-03-26 16:35:55.532
6f946cbb-2ffc-4369-ab5c-9d0735b3c76f	620de461-5368-46fd-beb2-d836b40700f0	Regular	640	\N	CS000158	\N	2106	20	\N	KG	2026-03-26 16:35:55.532	2026-03-26 16:35:55.532
4f6b92c1-cc9a-4e0e-9eea-3abf768770e8	91317605-4e58-47c6-8f4d-6006a2bb41f1	Regular	680	\N	CS000159	\N	2106	20	\N	KG	2026-03-26 16:35:55.533	2026-03-26 16:35:55.533
03ccf6a3-082c-4cc2-bd74-3d1578bb57bb	b68748e8-eb36-4c57-af4a-d71043e1f3f3	Regular	480	\N	CS000160	\N	2106	20	\N	KG	2026-03-26 16:35:55.533	2026-03-26 16:35:55.533
4b3067d1-9c89-4792-a896-699277bd9bb2	fb4e091e-2520-4f43-b3b5-8776aa6c00f3	Regular	480	\N	CS000161	\N	2106	20	\N	KG	2026-03-26 16:35:55.533	2026-03-26 16:35:55.533
3379664b-aaa1-49af-a124-93b0d36b3d78	fb4e091e-2520-4f43-b3b5-8776aa6c00f3	Regular	480	\N	CS000162	\N	2106	20	\N	KG	2026-03-26 16:35:55.533	2026-03-26 16:35:55.533
0194e94c-1b59-4489-aeae-42d203a2c0ad	76dcac8d-ecd4-45e9-9dcf-2cd27cb1e0f0	Regular	480	\N	CS000163	\N	2106	20	\N	KG	2026-03-26 16:35:55.534	2026-03-26 16:35:55.534
1eaf5c04-cf63-4f87-8e20-eecde0e4e53f	388cb7f1-0470-44fd-92eb-bbf99191b202	Regular	680	\N	CS000164	\N	2106	20	\N	KG	2026-03-26 16:35:55.534	2026-03-26 16:35:55.534
d8fbeb26-084d-417b-80b9-3380352dd232	2024bef9-8ca2-4f27-aad3-a749d37259d7	Regular	480	\N	CS000165	\N	2106	20	\N	KG	2026-03-26 16:35:55.534	2026-03-26 16:35:55.534
a640fbc0-bc0c-4e9e-b3a6-78da301eacee	2cd8822f-9674-46c9-b77d-8a4d54a054ff	Regular	480	\N	CS000166	\N	2106	20	\N	KG	2026-03-26 16:35:55.535	2026-03-26 16:35:55.535
11757b53-4929-42fc-9c5b-a9cd4b446a61	396f4650-b143-4c7e-9a4b-bc1df4d46632	Regular	320	\N	CS000167	\N	1904	20	\N	KG	2026-03-26 16:35:55.535	2026-03-26 16:35:55.535
c381f37e-73d7-4c82-bc1d-f8f528d5b153	ae1036f1-5f2c-4907-b8ea-a6b6e44bc079	Regular	380	\N	CS000168	\N	2106	20	\N	KG	2026-03-26 16:35:55.535	2026-03-26 16:35:55.535
46b76cf2-cdb0-4d63-95a8-4d45e91ca0e9	b2a4932f-70bd-4c57-9508-5af07dfceeac	250g	150	\N	CS000169	\N	1904	100	\N	PC	2026-03-26 16:35:55.536	2026-03-26 16:35:55.536
b9ba05ca-8931-4bd8-b188-e22c20b28157	129da097-155f-4efa-9f31-f5e9bfe0e3ad	250g	400	\N	CS000170	\N	1904	100	\N	PC	2026-03-26 16:35:55.536	2026-03-26 16:35:55.536
fdc1fa00-4415-42d4-8806-819dea8d32fc	e8724e2c-18f2-47f3-b4ef-1ee93d91aa09	Regular	340	\N	CS000171	\N	1904	20	\N	KG	2026-03-26 16:35:55.536	2026-03-26 16:35:55.536
24dab90c-3a12-4447-b6db-79d2ecd3e35a	7afc53c4-c091-469a-b2fa-35ab2ffa2e88	250g	350	\N	CS000172	\N	1904	100	\N	PC	2026-03-26 16:35:55.537	2026-03-26 16:35:55.537
883150a1-ae12-4c8a-8796-b4b5a47a7914	a9314c74-9fc1-4e8d-ac46-86f0c26659b6	Regular	150	\N	CS000173	\N	2105	100	\N	PC	2026-03-26 16:35:55.537	2026-03-26 16:35:55.537
a3b4e158-000e-46b7-8f97-6f2e276c54aa	0d2f82bc-4f6b-44ae-979f-c1549fd8a355	250g	320	\N	CS000174	\N	1904	100	\N	PC	2026-03-26 16:35:55.537	2026-03-26 16:35:55.537
bdebefee-131e-4973-b137-73fd725faf73	0d2f82bc-4f6b-44ae-979f-c1549fd8a355	100g	140	\N	CS000175	\N	1904	100	\N	PC	2026-03-26 16:35:55.537	2026-03-26 16:35:55.537
864e0e61-f62f-4989-bcbb-8eb2bb129da5	0e33218f-a2c5-421f-9d2f-640274cad536	Regular	25	\N	CS000176	\N	2105	100	\N	PC	2026-03-26 16:35:55.538	2026-03-26 16:35:55.538
c27a3d3c-82c8-4707-b19c-6f18ad484e72	066279ca-23cc-4f46-83c0-68196c4df263	Regular	30	\N	CS000177	\N	2105	100	\N	PC	2026-03-26 16:35:55.538	2026-03-26 16:35:55.538
813ec09a-3f51-4d42-a452-c650d529071d	d1fda3e7-e8ef-4d81-8952-f4e2675a31cb	Regular	70	\N	CS000178	\N	0401	100	\N	PC	2026-03-26 16:35:55.538	2026-03-26 16:35:55.538
cb074927-5451-4511-a4c0-5719c099df8e	9f7200e2-9c63-432b-9d41-b4c307d27d97	250g	50	\N	CS000179	\N	2106	100	\N	PC	2026-03-26 16:35:55.539	2026-03-26 16:35:55.539
9c4d6c19-1ce4-41e8-9cef-410ebd594cf2	a4682506-d379-47fe-8bcf-1e8b88c67e26	180g	50	\N	CS000180	\N	2106	100	\N	PC	2026-03-26 16:35:55.539	2026-03-26 16:35:55.539
659a9e87-7d37-468d-b458-3abb4cf3efe3	42254e2e-96b7-469b-9d34-ca7056cb57aa	500g	200	\N	CS000181	\N	2106	100	\N	PC	2026-03-26 16:35:55.539	2026-03-26 16:35:55.539
d8f7f152-77ec-40af-b96a-923c5fec8a25	9f7200e2-9c63-432b-9d41-b4c307d27d97	200g	62	\N	CS000182	\N	2106	100	\N	PC	2026-03-26 16:35:55.539	2026-03-26 16:35:55.539
3a27c5e0-be93-4007-a865-db368e472483	9f7200e2-9c63-432b-9d41-b4c307d27d97	Regular	280	\N	CS000183	\N	2106	20	\N	KG	2026-03-26 16:35:55.539	2026-03-26 16:35:55.539
791ffa2e-ce6d-45f4-95bc-d748792e7f67	a545ac54-1c95-48ad-b873-d86d75f6095c	200g	62	\N	CS000184	\N	2106	100	\N	PC	2026-03-26 16:35:55.54	2026-03-26 16:35:55.54
1dc79356-68f1-404b-81bb-5e459e948dcc	a545ac54-1c95-48ad-b873-d86d75f6095c	250g	60	\N	CS000185	\N	2106	100	\N	PC	2026-03-26 16:35:55.54	2026-03-26 16:35:55.54
ae61fb1a-7366-4983-961f-aac096733357	8ac6ed8a-287d-49ec-97b7-30087f4a9372	200g	62	\N	CS000186	\N	2106	100	\N	PC	2026-03-26 16:35:55.54	2026-03-26 16:35:55.54
691a48b4-cd04-4f0e-be53-f67ee7fa6bc1	1911a9e4-7dfd-4baa-b30d-31392814df4e	200g	62	\N	CS000187	\N	2106	100	\N	PC	2026-03-26 16:35:55.54	2026-03-26 16:35:55.54
674cc545-76f0-4f7f-80ff-2a9b2222b283	f4635acd-813e-4f7d-9b6a-de2cddd09d72	400g	122	\N	CS000188	\N	2106	100	\N	PC	2026-03-26 16:35:55.541	2026-03-26 16:35:55.541
9653b4a0-3ea6-4b36-b56f-432b9215bae6	d242ae6d-0ce3-43f0-82b2-29f79adabedf	600g	165	\N	CS000189	\N	2106	100	\N	PC	2026-03-26 16:35:55.541	2026-03-26 16:35:55.541
7ac14cd8-060f-4a71-b437-d0b6415909a1	5a082f0e-9397-47c4-9160-3fdb96497444	400g	115	\N	CS000190	\N	2106	100	\N	PC	2026-03-26 16:35:55.541	2026-03-26 16:35:55.541
a29c5460-dfa9-4ba5-a3e0-e23e4aab66cc	d242ae6d-0ce3-43f0-82b2-29f79adabedf	1kg	275	\N	CS000191	\N	2106	20	\N	KG	2026-03-26 16:35:55.541	2026-03-26 16:35:55.541
afb7d4be-8788-4809-bf6b-3b027fd06cbe	d242ae6d-0ce3-43f0-82b2-29f79adabedf	200g	57	\N	CS000192	\N	2106	100	\N	PC	2026-03-26 16:35:55.541	2026-03-26 16:35:55.541
f0580d4c-281f-4dda-9e75-862dc3d4e3bf	cdd42c20-8a4c-44d8-bec1-ca4a2aa4020c	Regular	15	\N	CS000193	\N	996331	100	\N	PC	2026-03-26 16:35:55.542	2026-03-26 16:35:55.542
325b6513-e307-4935-9e88-d0cc65d9e291	e02d0333-aeda-4777-8ac7-5ff826b2a311	Regular	115	\N	CS000194	\N	2105	100	\N	PC	2026-03-26 16:35:55.542	2026-03-26 16:35:55.542
dc6fa889-de41-4500-8de3-763626340f95	5a082f0e-9397-47c4-9160-3fdb96497444	200g	57	\N	CS000195	\N	2106	100	\N	PC	2026-03-26 16:35:55.542	2026-03-26 16:35:55.542
7768d350-6da5-4f7c-a9af-ce807d2b2ea5	8fd2e15f-c6af-4b18-82b4-258f4cd1290b	Regular	170	\N	CS000196	\N	2105	100	\N	PC	2026-03-26 16:35:55.543	2026-03-26 16:35:55.543
496dbc16-23b7-49a4-a6e3-b026747224a8	7af6ff71-4564-48e9-b22c-4d32ec23039f	Regular	175	\N	CS000197	\N	2105	100	\N	PC	2026-03-26 16:35:55.543	2026-03-26 16:35:55.543
f81b5993-fbe6-43e0-b584-2fd33d46d655	4b0cfa82-eb2f-44df-ae95-b5a04ec80745	Regular	155	\N	CS000198	\N	2105	100	\N	PC	2026-03-26 16:35:55.543	2026-03-26 16:35:55.543
28651964-36e9-4340-a1ae-db4f4cd321b4	8987a97e-bd27-45c1-abd1-f543f1501744	Regular	160	\N	CS000199	\N	2105	100	\N	PC	2026-03-26 16:35:55.543	2026-03-26 16:35:55.543
053866e7-8dff-4f82-8af7-46984482b643	dc0dd1f5-9c99-4c22-b13b-83c73aa49b3c	1L	132	\N	CS000200	\N	2202	100	\N	PC	2026-03-26 16:35:55.544	2026-03-26 16:35:55.544
58ac4e1c-8e6b-457b-ba7c-7382bb4e7aa8	706f40de-0dcf-412e-85fd-45685211e828	1L	122	\N	CS000201	\N	2202	100	\N	PC	2026-03-26 16:35:55.544	2026-03-26 16:35:55.544
f4267c8f-701c-4b02-ba66-15ac70446741	357cd02d-3082-4fb3-a942-0a1770b5550c	Regular	150	\N	CS000202	\N	2105	100	\N	PC	2026-03-26 16:35:55.544	2026-03-26 16:35:55.544
7bfa09ff-bc3f-4d5b-ad0a-618d007cf4b9	32cc2f54-74d0-4599-bb5a-3e2d48265daf	1L	122	\N	CS000203	\N	2202	100	\N	PC	2026-03-26 16:35:55.545	2026-03-26 16:35:55.545
cb0cbd3a-2293-4abb-8cfe-19cfb777a721	950e4fc5-22ec-4079-b0cc-9a84c5513371	1L	122	\N	CS000204	\N	2202	100	\N	PC	2026-03-26 16:35:55.545	2026-03-26 16:35:55.545
9ffd6bdf-ff60-42f5-b593-7b721bdfe4dc	f8d5e220-c45e-4e48-8918-2c54663271a3	Regular	80	\N	CS000205	\N	2106	100	\N	PC	2026-03-26 16:35:55.545	2026-03-26 16:35:55.545
45f66bd1-3eca-42f0-8b8a-d9d9480a728d	ca4ba551-be2f-435f-9888-942e021c9fe7	Regular	85	\N	CS000206	\N	2106	100	\N	PC	2026-03-26 16:35:55.546	2026-03-26 16:35:55.546
505c483a-5786-41fa-b20d-a7c530a8dfea	08ddf206-150b-489e-b3b1-aaa3d1740410	Regular	600	\N	CS000207	\N	2106	20	\N	KG	2026-03-26 16:35:55.546	2026-03-26 16:35:55.546
39a596a5-e38a-4cae-8374-87d59fddc4a8	38dd4996-debf-4c86-9233-c5815cf0014c	Regular	1280	\N	CS000208	\N	2106	20	\N	KG	2026-03-26 16:35:55.547	2026-03-26 16:35:55.547
efd5325f-069e-48de-a7b2-1c489b0b3ffb	529a3b0c-7f70-49af-865b-753f71df7fd7	Regular	640	\N	CS000209	\N	2106	20	\N	KG	2026-03-26 16:35:55.547	2026-03-26 16:35:55.547
d9e7a05d-3db1-4578-b079-93533c07dee0	bac36414-d3a7-47c9-a577-f158b76db8ec	Regular	600	\N	CS000210	\N	2106	20	\N	KG	2026-03-26 16:35:55.547	2026-03-26 16:35:55.547
e6ec1b51-78d9-4dc9-b7dc-5766ddedfd66	3999f8f6-6e2a-44c2-b63c-ef15df19c918	Regular	520	\N	CS000211	\N	2106	20	\N	KG	2026-03-26 16:35:55.548	2026-03-26 16:35:55.548
f2d8de52-a6c1-4954-a207-da3ad64dd39d	316418cf-9cf9-4542-b56a-3591be03abfd	200ml	30	\N	CS000212	\N	2202	100	\N	PC	2026-03-26 16:35:55.548	2026-03-26 16:35:55.548
27985bdd-1b4e-4d5a-b249-b45025d9f0c5	316418cf-9cf9-4542-b56a-3591be03abfd	250ml	20	\N	CS000213	\N	2202	100	\N	PC	2026-03-26 16:35:55.548	2026-03-26 16:35:55.548
8a08ec96-7f88-4015-8dc0-bbe09411e970	d78521b2-b5c8-477c-9ebd-075e16741e9a	Regular	560	\N	CS000214	\N	2106	20	\N	KG	2026-03-26 16:35:55.548	2026-03-26 16:35:55.548
ff335a48-3475-4c3d-9978-b36db3d2e083	316418cf-9cf9-4542-b56a-3591be03abfd	2L	100	\N	CS000215	\N	2202	100	\N	PC	2026-03-26 16:35:55.549	2026-03-26 16:35:55.549
12228910-7e72-49c8-8969-93f83052a2df	73a3c433-7bbc-43ca-b979-386fa177834b	200ml	30	\N	CS000216	\N	2202	100	\N	PC	2026-03-26 16:35:55.549	2026-03-26 16:35:55.549
4dfbceba-10db-4c9d-b433-5664c73a81a1	7b1c1768-0fb2-4446-9daf-7912707eb915	750ml	90	\N	CS000217	\N	2202	100	\N	PC	2026-03-26 16:35:55.549	2026-03-26 16:35:55.549
290e1f91-8df9-4618-a29a-d1185e0934d6	7b1c1768-0fb2-4446-9daf-7912707eb915	2L	100	\N	CS000218	\N	2202	100	\N	PC	2026-03-26 16:35:55.549	2026-03-26 16:35:55.549
d09490c5-9e70-4730-9731-e07a08191628	316418cf-9cf9-4542-b56a-3591be03abfd	750ml	90	\N	CS000219	\N	2202	100	\N	PC	2026-03-26 16:35:55.549	2026-03-26 16:35:55.549
e4c8b93d-081f-4ef9-b7d1-e009af8303f7	94b7f95b-65d8-4bfa-b2b0-f79fd0941725	Regular	30	\N	CS000220	\N	2106	100	\N	PC	2026-03-26 16:35:55.55	2026-03-26 16:35:55.55
d3b49405-ae84-4684-bdf8-6499743dada4	221e2930-bb3b-4666-8b99-d2222cfdd593	Regular	65	\N	CS000221	\N	2106	100	\N	PC	2026-03-26 16:35:55.55	2026-03-26 16:35:55.55
38b7132a-72a0-4d1e-a3c7-f2e31bac1dfe	7b1c1768-0fb2-4446-9daf-7912707eb915	250ml	20	\N	CS000222	\N	2202	100	\N	PC	2026-03-26 16:35:55.55	2026-03-26 16:35:55.55
4086dc05-a0dc-49eb-adf6-1c9de8ddd88d	81f13dc9-caad-438e-9443-216905889000	400g	105	\N	CS000223	\N	2106	100	\N	PC	2026-03-26 16:35:55.55	2026-03-26 16:35:55.55
d41c1230-69f7-4e52-95f0-518c71f8047c	ef6228ce-cda1-4ec5-aeac-2477ec9d8960	Regular	60	\N	CS000224	\N	2106	100	\N	PC	2026-03-26 16:35:55.551	2026-03-26 16:35:55.551
e56c8ce3-33a9-474b-b3c6-42cb49466c82	603224cd-cddf-4e37-bd51-e99e0371eec2	Regular	1400	\N	CS000225	\N	1904	20	\N	KG	2026-03-26 16:35:55.551	2026-03-26 16:35:55.551
540ea71b-92ee-4385-98ca-a7113f6d9647	56676f79-e5f6-48e8-8032-4215ba501c3b	Regular	25	\N	CS000226	\N	2106	100	\N	PC	2026-03-26 16:35:55.551	2026-03-26 16:35:55.551
72898e4c-b325-4028-bd4f-c1b690040a37	244fc0a9-0666-4655-a9c7-7a746918c2a2	Regular	20	\N	CS000227	\N	996331	100	\N	PC	2026-03-26 16:35:55.552	2026-03-26 16:35:55.552
a9be35b9-c857-4444-8212-ca58feadba01	96c11e3d-4d6c-47cd-8cbf-8ccc466fc0f0	Regular	480	\N	CS000228	\N	0401	20	\N	KG	2026-03-26 16:35:55.552	2026-03-26 16:35:55.552
62ec81e7-8818-4fb1-9407-03e9df25add2	20ae8f88-6606-4f9c-9619-47cef7c4f807	Regular	120	\N	CS000229	\N	2106	20	\N	KG	2026-03-26 16:35:55.552	2026-03-26 16:35:55.552
e75defac-6164-4fc8-9f08-fe84df20a209	171bbc46-ece3-45ae-9812-49c5845beb46	230g	170	\N	CS000230	\N	1905	100	\N	PC	2026-03-26 16:35:55.553	2026-03-26 16:35:55.553
a2c199b6-0ca4-4440-8b9b-8b7322a06a0c	557a1278-09e5-42e5-b516-d2c068186371	250g	130	\N	CS000231	\N	1905	100	\N	PC	2026-03-26 16:35:55.553	2026-03-26 16:35:55.553
54b46110-152a-455a-b325-25a6534336df	5296381e-20ca-4975-8c14-cb2a7d47b817	Regular	30	\N	CS000232	\N	996331	100	\N	PC	2026-03-26 16:35:55.553	2026-03-26 16:35:55.553
877c3137-be6a-4f83-87f0-924a849de612	2898cfd6-ceb7-467c-9005-edbe0c696fa7	250g	160	\N	CS000233	\N	1905	100	\N	PC	2026-03-26 16:35:55.553	2026-03-26 16:35:55.553
90ed147c-8752-4a07-852d-b791ae04431a	9856e762-5bdc-45ab-8ade-8d9b9a6d4ee7	Regular	115	\N	CS000234	\N	1905	100	\N	PC	2026-03-26 16:35:55.554	2026-03-26 16:35:55.554
5851df21-8523-4687-91d3-ceda88a11899	d0457ca3-d43f-4b2e-9a87-20ec32918083	125ml	10	\N	CS000235	\N	2202	100	\N	PC	2026-03-26 16:35:55.554	2026-03-26 16:35:55.554
145f7ebd-3b92-432c-a1f8-d57e1434faf5	a35f2f7f-5ae7-4d18-93c9-2503b029537c	180ml	30	\N	CS000236	\N	2202	100	\N	PC	2026-03-26 16:35:55.554	2026-03-26 16:35:55.554
5259ab7d-a494-47fd-b8d5-9c7c3c4fe728	b878b177-c4a2-46da-a561-e2273a99c840	750ml	40	\N	CS000237	\N	2202	100	\N	PC	2026-03-26 16:35:55.555	2026-03-26 16:35:55.555
1fa3a96f-ddca-4866-a6db-fce7295ef536	b878b177-c4a2-46da-a561-e2273a99c840	400ml	20	\N	CS000238	\N	2202	100	\N	PC	2026-03-26 16:35:55.555	2026-03-26 16:35:55.555
c20beb30-7d57-42a9-90a2-33f61d37579a	b3452ea8-b066-4b02-a229-e095963144ca	180ml	20	\N	CS000239	\N	2202	100	\N	PC	2026-03-26 16:35:55.555	2026-03-26 16:35:55.555
2bd42c55-2c98-4619-83de-8abb08017930	8d1f96e4-59a1-498c-b35d-ee469b9b3be5	180ml	30	\N	CS000240	\N	2202	100	\N	PC	2026-03-26 16:35:55.555	2026-03-26 16:35:55.555
e33ae54b-f6fa-47f0-8ce7-64981c3476df	bef7d12a-2a47-40a4-8c15-c25d9098c605	2L	100	\N	CS000241	\N	2202	100	\N	PC	2026-03-26 16:35:55.556	2026-03-26 16:35:55.556
5d721a7d-0065-4c90-8725-d5f2a2d0cbd4	bef7d12a-2a47-40a4-8c15-c25d9098c605	1L	50	\N	CS000242	\N	2202	100	\N	PC	2026-03-26 16:35:55.556	2026-03-26 16:35:55.556
f9bbb499-a878-49d7-ae44-cbb439251695	234bdee7-6ef8-4ff7-aebb-36b81e203b60	Regular	30	\N	CS000243	\N	2201	100	\N	PC	2026-03-26 16:35:55.556	2026-03-26 16:35:55.556
562f390b-762a-4073-af79-f3b427db1f1a	1d5bf0fd-7db5-4777-a3c3-26bb4474e840	148g	40	\N	CS000244	\N	1905	100	\N	PC	2026-03-26 16:35:55.556	2026-03-26 16:35:55.556
108b03f5-c0a5-4681-a050-656a7d2a848b	da45849e-2608-45f3-bd4c-11a9c7322f98	208g	30	\N	CS000245	\N	1905	100	\N	PC	2026-03-26 16:35:55.558	2026-03-26 16:35:55.558
edf47282-6731-4ae4-8172-0bfc48b225e4	e5d212c6-397d-451c-8a3c-0922c8435193	25L	50	\N	CS000246	\N	2202	100	\N	PC	2026-03-26 16:35:55.559	2026-03-26 16:35:55.559
e559842a-ee8e-40bc-8e00-70a5b4c2793b	8351aa94-6e48-4107-b1bf-fe08c30a843b	200g	45	\N	CS000247	\N	2106	100	\N	PC	2026-03-26 16:35:55.559	2026-03-26 16:35:55.559
3cd66c34-2994-4247-8114-874cd407e6b9	e5f83d6f-92e5-427a-a5aa-5bfecd8dd59e	Regular	480	\N	CS000248	\N	2106	20	\N	KG	2026-03-26 16:35:55.559	2026-03-26 16:35:55.559
e390b85e-bc44-4507-b138-a184eadb2d88	16fe8d8e-7408-41cf-9b82-b059573ce1d1	250g	50	\N	CS000249	\N	2106	100	\N	PC	2026-03-26 16:35:55.56	2026-03-26 16:35:55.56
466b0b78-dedb-4741-a305-d1cdee64c209	7a4a86a1-2b7a-4e9d-88f6-113f35467a08	Regular	480	\N	CS000250	\N	2106	20	\N	KG	2026-03-26 16:35:55.56	2026-03-26 16:35:55.56
b85a9909-ff0d-4317-abdb-684650423abf	e289d132-617b-44b4-8468-4ee8ab0040b4	Regular	560	\N	CS000251	\N	2106	20	\N	KG	2026-03-26 16:35:55.56	2026-03-26 16:35:55.56
077b0387-c449-43ba-9383-562e98e94d0c	932cb12f-0cb9-4b6b-8662-c10f203828cf	250g	50	\N	CS000252	\N	2106	100	\N	PC	2026-03-26 16:35:55.56	2026-03-26 16:35:55.56
db55c2bd-b021-453f-b61f-037a4e947241	cbdfc666-7ac3-4658-89c7-3d436b2a37df	750ml	180	\N	CS000254	\N	2202	100	\N	PC	2026-03-26 16:35:55.561	2026-03-26 16:35:55.561
244e5f7a-70b5-4143-9c6f-82f02aeefe7e	14e2d851-6b7b-4337-ac1f-ad6cec44ff28	250g	60	\N	CS000255	\N	2106	100	\N	PC	2026-03-26 16:35:55.561	2026-03-26 16:35:55.561
79412a6b-2570-4240-a5c7-6407645c3b42	153ae4f7-5691-45ca-ad58-391a2fb4a983	750ml	180	\N	CS000256	\N	2202	100	\N	PC	2026-03-26 16:35:55.562	2026-03-26 16:35:55.562
99db00a0-4df2-4608-9e81-75071985ee71	dd1cb594-1347-4439-a518-6446b8e77197	750ml	160	\N	CS000257	\N	2202	100	\N	PC	2026-03-26 16:35:55.562	2026-03-26 16:35:55.562
98f1db1f-06c8-4997-9ac9-d854ea74d5b8	9e2ab3f1-7b36-4195-9aa6-c8b8501cba18	750ml	180	\N	CS000258	\N	2202	100	\N	PC	2026-03-26 16:35:55.562	2026-03-26 16:35:55.562
5d26b75a-62ed-471c-9219-4d61bf94e425	210f8a41-7e18-4853-b40c-7b78a0cceb76	1L	122	\N	CS000259	\N	2202	100	\N	PC	2026-03-26 16:35:55.563	2026-03-26 16:35:55.563
b8ad7a97-d22c-403b-a3d0-9fe67c6b38c0	3a4270d6-ce98-474d-84fc-5a5ae3ac51e9	Regular	600	\N	CS000260	\N	2106	20	\N	KG	2026-03-26 16:35:55.563	2026-03-26 16:35:55.563
7079e60d-03ea-493c-9c59-547de8eb72b7	baefb42b-90ee-49c1-a07b-ab62cdf37549	750ml	160	\N	CS000261	\N	2202	100	\N	PC	2026-03-26 16:35:55.563	2026-03-26 16:35:55.563
17fbb04c-fd48-4916-931d-dc24bcc5393c	cb81243f-3bd4-42cc-a268-028470faf401	Regular	480	\N	CS000262	\N	2106	20	\N	KG	2026-03-26 16:35:55.564	2026-03-26 16:35:55.564
30ddb60f-d498-429a-85fc-3bc48a54e275	b3fd20f0-a8c9-431b-b48c-3e428b6c2d52	Regular	440	\N	CS000263	\N	0406	20	\N	KG	2026-03-26 16:35:55.564	2026-03-26 16:35:55.564
d65e141b-3b2b-4150-91d4-51587ed2b1e8	66a71ee0-f4d3-47f9-8ebc-47881315a1b7	Regular	480	\N	CS000264	\N	2106	20	\N	KG	2026-03-26 16:35:55.564	2026-03-26 16:35:55.564
c9fc0a7d-cc4d-4ee8-acfc-b5ac4213521c	3741fc6d-20bd-4057-9bec-2e5c82d406c5	Regular	350	\N	CS000265	\N	2106	20	\N	KG	2026-03-26 16:35:55.565	2026-03-26 16:35:55.565
75d62ee9-6af3-4e2c-9b7a-6b4e9d491a15	a2071d27-58c0-4998-9366-2516d714423c	Regular	20	\N	CS000266	\N	996331	100	\N	PC	2026-03-26 16:35:55.565	2026-03-26 16:35:55.565
06b9b3b0-f73f-437d-832d-3b19195d5c62	97ce127a-b27b-4d97-aca8-7fbc729bd990	Regular	140	\N	CS000267	\N	0403	20	\N	KG	2026-03-26 16:35:55.565	2026-03-26 16:35:55.565
c79b3c28-a377-40df-82e9-a951f2b09601	f34a0753-f4ff-4e3c-ae1e-7a4ba0a95522	Regular	40	\N	CS000268	\N	2202	100	\N	PC	2026-03-26 16:35:55.566	2026-03-26 16:35:55.566
bb386763-0e5d-4fb8-a018-bbd7a5152c16	ead4efe3-2a0e-470d-a2d4-ef0c906f1c39	Regular	10	\N	CS000269	\N	1806	100	\N	PC	2026-03-26 16:35:55.566	2026-03-26 16:35:55.566
25fe8f92-5614-49cf-bb0d-e9daf8daf221	bfdb3186-6003-452c-8d82-88bd29454ffd	Regular	20	\N	CS000270	\N	1806	100	\N	PC	2026-03-26 16:35:55.566	2026-03-26 16:35:55.566
a7450847-9cf3-4327-82a7-0a01c06ab6d6	58bdfe21-abae-468f-a087-2aa839674c4f	Regular	175	\N	CS000271	\N	2105	100	\N	PC	2026-03-26 16:35:55.567	2026-03-26 16:35:55.567
871b3371-8021-4812-8900-4f69b52a2ead	aab440e8-9276-4562-98e8-a6b02dcde740	Regular	120	\N	CS000272	\N	0710	20	\N	KG	2026-03-26 16:35:55.567	2026-03-26 16:35:55.567
b3f5d3ba-2621-444c-b9e1-7ab4ac79e542	45ada657-5576-46d7-aa41-a50bbd9e4f38	Regular	140	\N	CS000273	\N	2105	100	\N	PC	2026-03-26 16:35:55.567	2026-03-26 16:35:55.567
1c37fdd2-303f-460d-9ae2-b6f75335a30c	f2c51ed3-d93d-43e8-a5c3-b39605224510	Regular	120	\N	CS000274	\N	2105	100	\N	PC	2026-03-26 16:35:55.567	2026-03-26 16:35:55.567
546cf6af-2f22-4088-b731-297730e30d82	e92df644-cfdc-4665-a6a8-36e0e13bf3d9	Regular	135	\N	CS000275	\N	2105	100	\N	PC	2026-03-26 16:35:55.568	2026-03-26 16:35:55.568
cde909c8-da28-4353-a442-aec76ce1519b	5249cfb3-e0f4-4f59-a25b-753e4700d004	Regular	175	\N	CS000276	\N	2105	100	\N	PC	2026-03-26 16:35:55.568	2026-03-26 16:35:55.568
47464f29-c8dc-4e13-8173-c4b5f57d87f8	71518324-2fc5-44e6-be60-1b568e606e0f	Regular	110	\N	CS000277	\N	2105	100	\N	PC	2026-03-26 16:35:55.568	2026-03-26 16:35:55.568
77f0b004-e93c-4466-90c1-82bff5c69016	f612ee4b-be56-4e81-b2d5-e25eaa2e5745	Regular	20	\N	CS000278	\N	1905	100	\N	PC	2026-03-26 16:35:55.569	2026-03-26 16:35:55.569
cad3b9be-e997-48ac-b7c3-be244c63f1e1	acb2a530-d112-4725-abdf-8551d71aef6b	Regular	20	\N	CS000279	\N	2202	100	\N	PC	2026-03-26 16:35:55.569	2026-03-26 16:35:55.569
06df4fc8-67a6-4813-9030-c06010608409	e0a3cb3f-27a3-469e-87eb-873837635be9	Regular	70	\N	CS000280	\N	4823	100	\N	PC	2026-03-26 16:35:55.569	2026-03-26 16:35:55.569
264a3dc8-98a0-44c0-ace5-dc298f89e571	f32434d4-3308-451d-a1c4-a6522656f629	Regular	100	\N	CS000281	\N	4823	100	\N	PC	2026-03-26 16:35:55.57	2026-03-26 16:35:55.57
1bfee641-dc55-41c6-a3ef-390aa4fa4f68	d919e46b-d56d-4988-9985-f8149eda9e6a	Regular	100	\N	CS000282	\N	3924	100	\N	PC	2026-03-26 16:35:55.57	2026-03-26 16:35:55.57
4f32356b-c791-49be-8e3d-9bdc325b8faf	5a6b7eec-27da-4d05-b785-91ec41968184	Regular	80	\N	CS000283	\N	4823	100	\N	PC	2026-03-26 16:35:55.57	2026-03-26 16:35:55.57
683f989e-ce57-4010-bfc4-5a4f408684f1	7f2d6ee4-8654-4af0-a12a-659276354511	Regular	20	\N	CS000284	\N	2202	100	\N	PC	2026-03-26 16:35:55.571	2026-03-26 16:35:55.571
9f7fdf9b-d2bf-417c-b4dc-45b5b09c39fd	edfa152c-64bc-4a54-a97e-130a9a9cd635	250ml	20	\N	CS000285	\N	2202	100	\N	PC	2026-03-26 16:35:55.571	2026-03-26 16:35:55.571
83c0a891-22ad-4c3b-a580-ba0a08c3dd6d	e7049955-f4fd-4ce9-be07-48438c6b2515	750ml	20	\N	CS000286	\N	2201	100	\N	PC	2026-03-26 16:35:55.571	2026-03-26 16:35:55.571
25cd79fd-536f-48f7-ae4b-b9ba18e0e20b	d9ef4f91-5b28-4020-a2fa-398e8463f885	Regular	360	\N	CS000287	\N	2106	19	\N	KG	2026-03-26 16:35:55.572	2026-03-29 17:38:00.401
07d881ba-7c0e-4300-8206-a86c51ceb4c6	bc7c3288-8da0-4d5e-8052-ab86bcc1d857	Regular	1200	\N	CS000288	\N	2106	20	\N	KG	2026-03-26 16:35:55.572	2026-03-26 16:35:55.572
aae6b95b-bc0f-4ab3-a08b-8ec2f1772433	bea78743-f406-4271-80ec-faa88ed84b16	Regular	560	\N	CS000289	\N	2106	20	\N	KG	2026-03-26 16:35:55.572	2026-03-26 16:35:55.572
ca0235ac-5dca-4850-be09-1973bbc906e4	accfad18-ed8b-4d88-aca0-ab0677bb95d0	500ml	220	\N	CS000290	\N	2201	100	\N	PC	2026-03-26 16:35:55.572	2026-03-26 16:35:55.572
660f9504-f7ca-4fa6-98da-f46a348626c1	c1724d04-53e0-4827-bb49-210a50b4e081	Regular	600	\N	CS000291	\N	2106	20	\N	KG	2026-03-26 16:35:55.573	2026-03-26 16:35:55.573
fa6a026a-460f-44dc-aa34-24f400248d46	3c30ae3a-6aec-4767-9c9e-2acd00d81e7c	Regular	640	\N	CS000292	\N	2106	20	\N	KG	2026-03-26 16:35:55.573	2026-03-26 16:35:55.573
f208b71f-34f9-4648-9903-9ad21a304bc8	7528e0ea-974a-423f-9cb7-7e78dc3e9843	Regular	560	\N	CS000293	\N	2106	20	\N	KG	2026-03-26 16:35:55.573	2026-03-26 16:35:55.573
e2498145-2942-4cd1-ba01-d37389528369	bd6dcb54-95f1-4b0e-8fb5-89fa23b890db	Regular	440	\N	CS000294	\N	2106	20	\N	KG	2026-03-26 16:35:55.573	2026-03-26 16:35:55.573
356c6d75-97f7-4d6b-b3e3-84f50c913c14	4dcf1f3b-9dc7-4226-b235-dc815e6d988c	200g	89	\N	CS000295	\N	2106	100	\N	PC	2026-03-26 16:35:55.574	2026-03-26 16:35:55.574
b6645439-01fe-4e74-91cc-f60d9e0b56e0	0929dae8-aa9a-4b53-8a35-c6b64c837180	400g	160	\N	CS000296	\N	2106	100	\N	PC	2026-03-26 16:35:55.574	2026-03-26 16:35:55.574
41c8f2b7-9e27-4ec9-aead-0109335de0b5	54429d5c-2125-4611-878d-3635a99ad7a6	Regular	520	\N	CS000297	\N	2106	20	\N	KG	2026-03-26 16:35:55.574	2026-03-26 16:35:55.574
4df057f1-5ba5-432d-9380-03401d4aa971	c5b97ac5-f2ad-4ca4-b8e0-22e16aaf13a2	Regular	520	\N	CS000298	\N	2106	20	\N	KG	2026-03-26 16:35:55.574	2026-03-26 16:35:55.574
8a878bec-f554-4104-b4f1-2fd2003f6910	0929dae8-aa9a-4b53-8a35-c6b64c837180	900g	215	\N	CS000299	\N	2106	100	\N	PC	2026-03-26 16:35:55.575	2026-03-26 16:35:55.575
935f025b-1a63-4631-802b-969502aaa672	76a77a4c-2c22-4e12-9179-e30a1f0115ca	200g	89	\N	CS000300	\N	2106	100	\N	PC	2026-03-26 16:35:55.575	2026-03-26 16:35:55.575
526fd903-6f05-47b3-80e0-f4fce5639361	14aa7496-4817-4d57-abfb-921d992eb4d6	250g	80	\N	CS000301	\N	2106	100	\N	PC	2026-03-26 16:35:55.575	2026-03-26 16:35:55.575
55577891-8eb6-4eae-b14a-333d460736c9	2d27fda8-2206-463e-8331-abc17efbe400	2kg	225	\N	CS000302	\N	2103	100	\N	PC	2026-03-26 16:35:55.575	2026-03-26 16:35:55.575
f7b014ad-d593-4e94-b87f-9169a32cbef2	f31e6e83-379d-4db1-a569-4753608eab27	400g	95	\N	CS000303	\N	2106	100	\N	PC	2026-03-26 16:35:55.576	2026-03-26 16:35:55.576
29a494a1-6cd2-46cd-947e-3b31f1f1593d	555837ad-ade0-41e8-a2eb-19da55dc54d3	200g	45	\N	CS000304	\N	2106	100	\N	PC	2026-03-26 16:35:55.576	2026-03-26 16:35:55.576
e1fd210c-32c1-42a1-84d5-f806c9d89087	f31e6e83-379d-4db1-a569-4753608eab27	200g	55	\N	CS000305	\N	2106	100	\N	PC	2026-03-26 16:35:55.576	2026-03-26 16:35:55.576
0b75de7e-13ba-4793-93a4-42f6ad0f2189	ee132163-76b4-419a-96a2-7f6e7903e73e	200g	55	\N	CS000306	\N	2106	100	\N	PC	2026-03-26 16:35:55.576	2026-03-26 16:35:55.576
05e36661-7717-43a9-bd38-719e0bf0854d	3ddf8c1b-6d06-423e-827f-5ce31a49ceae	Regular	35	\N	CS000307	\N	1704	100	\N	PC	2026-03-26 16:35:55.577	2026-03-26 16:35:55.577
3b2646ec-e6e5-4203-bafe-3818708e31e0	630851bf-8e5e-4529-a90e-061294ceb351	Regular	20	\N	CS000308	\N	1704	100	\N	PC	2026-03-26 16:35:55.577	2026-03-26 16:35:55.577
becd22e4-6bde-4e5e-befa-c483c8781c47	c97ae993-d62f-4893-89cd-d9fe517ae7f3	Regular	40	\N	CS000309	\N	1704	100	\N	PC	2026-03-26 16:35:55.577	2026-03-26 16:35:55.577
9798a9ff-ab5d-467f-9871-4fa59e8dcec1	555837ad-ade0-41e8-a2eb-19da55dc54d3	400g	88	\N	CS000310	\N	2106	100	\N	PC	2026-03-26 16:35:55.577	2026-03-26 16:35:55.577
84fbe0ce-70a2-4c98-a2a0-e1845416fd10	c3a4aa7e-7ed0-4c32-86cd-df5303822517	200g	45	\N	CS000311	\N	2106	100	\N	PC	2026-03-26 16:35:55.577	2026-03-26 16:35:55.577
bbddf797-0f20-43eb-b367-e0bd085179dd	741b2a04-a4c9-4b27-b93d-45f5307c45e0	Regular	20	\N	CS000312	\N	2105	100	\N	PC	2026-03-26 16:35:55.578	2026-03-26 16:35:55.578
87d074a4-79d3-4f62-9285-e216455fd1db	904dad94-542b-4573-b7a0-6f5919155913	160g	60	\N	CS000313	\N	2106	100	\N	PC	2026-03-26 16:35:55.578	2026-03-26 16:35:55.578
5fa894f9-d9c6-4ae8-9985-c601f105737d	25e47ace-6a89-431a-bd8a-8607118a9759	Regular	30	\N	CS000314	\N	2105	100	\N	PC	2026-03-26 16:35:55.578	2026-03-26 16:35:55.578
bdee78af-58fa-4526-b613-ed974a19db41	e41496eb-680c-4ad9-90af-39d386d10dd4	Regular	20	\N	CS000315	\N	2105	100	\N	PC	2026-03-26 16:35:55.578	2026-03-26 16:35:55.578
3e3d248c-519d-46c4-ad7a-f763e73e4a6d	eec5826f-dede-44f0-a221-4824f5725c5f	180g	75	\N	CS000316	\N	2106	100	\N	PC	2026-03-26 16:35:55.579	2026-03-26 16:35:55.579
af4fdc19-a6fe-4e87-909b-6eaf6f5b6494	0c3f88bc-3c10-4c58-8860-2318c5143dc5	500g	100	\N	CS000317	\N	2106	100	\N	PC	2026-03-26 16:35:55.579	2026-03-26 16:35:55.579
02c5b6b3-25a9-45ac-8c50-4fed578795f3	8901808e-6a9f-4fd3-bda0-88d1d8470894	100g	75	\N	CS000318	\N	2106	100	\N	PC	2026-03-26 16:35:55.579	2026-03-26 16:35:55.579
a8141ac2-0a9a-45bf-ba1a-4d83acb66fde	2c330481-87cb-4dca-9a5e-3e904582d774	180g	80	\N	CS000319	\N	2106	100	\N	PC	2026-03-26 16:35:55.579	2026-03-26 16:35:55.579
4c7eabb1-d122-495e-827a-246d750a0e23	27618afc-2868-4d63-accb-8a6f5961159d	Regular	95	\N	CS000320	\N	2106	100	\N	PC	2026-03-26 16:35:55.58	2026-03-26 16:35:55.58
2100d523-a2bf-45ce-bfbc-ea59798430f4	54ffc7d1-2905-42ce-8fd6-95b7cb456096	250g	60	\N	CS000321	\N	2106	100	\N	PC	2026-03-26 16:35:55.58	2026-03-26 16:35:55.58
c4b4f642-4795-4fcd-afda-3a8fd280460c	a78bcf3f-2089-42d6-966d-82934b3b842e	120g	95	\N	CS000322	\N	2106	100	\N	PC	2026-03-26 16:35:55.58	2026-03-26 16:35:55.58
6ef8d027-a997-48cd-8e44-1a8d03875467	04756e0a-0f1a-4b90-84c3-d4eb5eea861e	100g	55	\N	CS000323	\N	2106	99	\N	PC	2026-03-26 16:35:55.58	2026-03-29 17:38:00.406
ba64be08-04ed-4ed6-b54b-dcfc60e66c0c	c2c1f576-88d2-472c-9f77-88240e7cdff5	Regular	520	\N	CS000324	\N	2106	20	\N	KG	2026-03-26 16:35:55.581	2026-03-26 16:35:55.581
d9c1544d-6f4b-4328-8c25-7f7688d5d421	27cd3574-8afe-415a-8a46-473b595a172b	120g	90	\N	CS000325	\N	1704	100	\N	PC	2026-03-26 16:35:55.581	2026-03-26 16:35:55.581
901682ca-3ede-4954-85da-54d9713f7507	30854251-af5a-4a32-b95c-cb4eb7ae7f75	135g	85	\N	CS000326	\N	1704	100	\N	PC	2026-03-26 16:35:55.581	2026-03-26 16:35:55.581
f5c5649b-5508-4744-8c12-0d3b0d2fcd4c	7ee2932c-47ef-4d55-9c57-6d7f873f7af6	80g	90	\N	CS000327	\N	1704	100	\N	PC	2026-03-26 16:35:55.581	2026-03-26 16:35:55.581
f0c6a4d5-15ed-4fa0-b836-b3764572b466	f9caa2c4-5c16-47ac-972f-ccbb0ec92f87	Regular	360	\N	CS000328	\N	2106	20	\N	KG	2026-03-26 16:35:55.582	2026-03-26 16:35:55.582
cfad8114-b3fd-4ddb-885b-3ef6ffa9223c	9a975361-a172-48b5-bd36-506be4f0d2ad	Regular	560	\N	CS000329	\N	2106	20	\N	KG	2026-03-26 16:35:55.582	2026-03-26 16:35:55.582
371f87a0-8ee6-4533-a4a7-56c738f436ae	58596386-83d6-4de2-8571-087d718941f3	Regular	560	\N	CS000330	\N	2106	20	\N	KG	2026-03-26 16:35:55.582	2026-03-26 16:35:55.582
05a24552-c568-4091-860f-41e710738cd0	ccf8af88-d50c-49f5-9298-95ac5c1b4a6d	Regular	560	\N	CS000331	\N	2106	20	\N	KG	2026-03-26 16:35:55.582	2026-03-26 16:35:55.582
d332348d-38d3-4c64-bbab-c1feb03086dd	6a1ded4a-33f7-4646-a7c3-e223f2c882f3	Regular	300	\N	CS000332	\N	1702	20	\N	KG	2026-03-26 16:35:55.583	2026-03-26 16:35:55.583
1cd65646-ec09-4ee3-95ce-3e8a701c4e60	bff9dff8-fae5-4682-b762-04c68c927791	Regular	480	\N	CS000333	\N	2106	20	\N	KG	2026-03-26 16:35:55.583	2026-03-26 16:35:55.583
5d591e79-6498-4579-b706-3c8c53018de8	831d4a88-f5b5-452b-9249-71e0839f4a0a	Regular	43	\N	CS000334	\N	2106	20	\N	KG	2026-03-26 16:35:55.583	2026-03-26 16:35:55.583
44677991-fc58-425c-996b-57dc03fe8ede	c3893512-5089-44a4-aa1a-08b64ad08a04	Regular	320	\N	CS000335	\N	1701	20	\N	KG	2026-03-26 16:35:55.583	2026-03-26 16:35:55.583
52572a00-e1d8-46b3-a30b-fa2a84cf51b0	cd3acd28-696a-4886-91bc-c3cb648a2a80	Regular	1	\N	CS000336	\N	2103	100	\N	PC	2026-03-26 16:35:55.584	2026-03-26 16:35:55.584
7c56afad-a8f7-4c9b-861a-a60ec12ad3ca	f0dba77a-5c13-4b0e-9e22-56b2a6feb731	500g	175	\N	CS000337	\N	2106	100	\N	PC	2026-03-26 16:35:55.584	2026-03-26 16:35:55.584
1a142bbb-fc8d-49a0-818c-3b1b276f73fe	67324d85-1533-4666-b1aa-5a268b0878eb	250g	130	\N	CS000338	\N	1905	100	\N	PC	2026-03-26 16:35:55.584	2026-03-26 16:35:55.584
ebd63b2d-9a60-47f0-891c-88fd9d3819fd	a83b4c14-8462-404b-81d1-b7a789c3dc6b	Regular	20	\N	CS000339	\N	1905	100	\N	PC	2026-03-26 16:35:55.584	2026-03-26 16:35:55.584
912517fc-6e99-46ed-946a-ea1285b982a4	8b5744d6-35a9-49a6-883c-333daf439e82	Regular	399	\N	CS000340	\N	2202	100	\N	PC	2026-03-26 16:35:55.584	2026-03-26 16:35:55.584
e2dd8657-d7f9-47bb-849c-3e19337b44f6	14e2f5d0-1c0f-4433-98d3-51926541d611	Regular	480	\N	CS000341	\N	2106	20	\N	KG	2026-03-26 16:35:55.585	2026-03-26 16:35:55.585
62adb4f7-7ac8-4540-8f9e-64bd5d27f5a3	f0dba77a-5c13-4b0e-9e22-56b2a6feb731	100g	44	\N	CS000342	\N	2106	100	\N	PC	2026-03-26 16:35:55.585	2026-03-26 16:35:55.585
4dfe97ac-05f4-4a0f-9739-16b6157a6d74	c61541c7-e2e9-4b10-b00e-c2851718624c	500g	175	\N	CS000343	\N	2106	100	\N	PC	2026-03-26 16:35:55.585	2026-03-26 16:35:55.585
049ea4e6-390f-4ee5-89ac-4db34826d136	c61541c7-e2e9-4b10-b00e-c2851718624c	100g	44	\N	CS000344	\N	2106	100	\N	PC	2026-03-26 16:35:55.585	2026-03-26 16:35:55.585
4740c346-8f4d-4b32-b2e6-3f02d8476a1a	c277552b-be81-406c-afa6-e4608388069f	100g	40	\N	CS000345	\N	2106	100	\N	PC	2026-03-26 16:35:55.586	2026-03-26 16:35:55.586
f436ed9b-f734-4926-8c09-66e602ae0371	bf3e19d0-950d-47a8-8bdb-57448cf1d482	Regular	60	\N	CS000346	\N	2106	100	\N	PC	2026-03-26 16:35:55.586	2026-03-26 16:35:55.586
355e60cb-e558-48ac-949f-03e3f06c1fa8	42e17364-1931-4ee7-b85d-e6429cd2b324	Regular	50	\N	CS000347	\N	2106	100	\N	PC	2026-03-26 16:35:55.586	2026-03-26 16:35:55.586
0f4c4d9e-2a5d-4e2b-8000-d4ea63d6abb9	8286b7d5-c5dc-41c5-8f05-6e373b2029ff	Regular	60	\N	CS000348	\N	2106	100	\N	PC	2026-03-26 16:35:55.586	2026-03-26 16:35:55.586
2f48b8d5-d496-4047-b8ca-f039ad5735ab	57e527e9-9bcc-4da0-b225-2187c626db07	Regular	60	\N	CS000349	\N	2106	100	\N	PC	2026-03-26 16:35:55.587	2026-03-26 16:35:55.587
86bfe3fd-be7e-4afa-8367-fe22ba1affc3	61335326-beae-4ce8-9c03-d577d5ee7063	100g	60	\N	CS000350	\N	2106	100	\N	PC	2026-03-26 16:35:55.587	2026-03-26 16:35:55.587
ed923d75-026c-4328-a300-58793499beb2	aaddb7e7-7739-491a-8cd4-0b2e3ad4f4f9	100g	35	\N	CS000351	\N	2106	100	\N	PC	2026-03-26 16:35:55.587	2026-03-26 16:35:55.587
26d188a7-ed86-4529-ba84-3a9e9578c66e	395d5ba8-f549-403f-89b0-becd3da91ea8	Regular	15	\N	CS000352	\N	996331	100	\N	PC	2026-03-26 16:35:55.587	2026-03-26 16:35:55.587
1782e144-8294-48b2-b75e-1512a4c36241	a186bf94-d99f-4f63-8ffe-f3b298a175b4	350g	95	\N	CS000353	\N	2106	100	\N	PC	2026-03-26 16:35:55.588	2026-03-26 16:35:55.588
f6c59df7-1910-4fa9-85f3-589c3281d253	8d44a455-e8e6-440d-b67e-50333478f227	Regular	50	\N	CS000354	\N	2106	100	\N	PC	2026-03-26 16:35:55.588	2026-03-26 16:35:55.588
e47160d2-f1af-43a5-b957-36be5eec3e80	ef8307c5-69a0-4e55-af22-6bd83d36cc35	Regular	50	\N	CS000355	\N	2106	100	\N	PC	2026-03-26 16:35:55.588	2026-03-26 16:35:55.588
73b45557-c5a0-4d23-ab14-055acb26a36c	38a16c09-845d-4fec-8094-ea41fdec8c81	Regular	35	\N	CS000356	\N	996331	100	\N	PC	2026-03-26 16:35:55.588	2026-03-26 16:35:55.588
6506295f-df5a-42af-b63a-66f98e7a4bd7	5877ef78-e396-4ac4-9b18-ba066a4c78b1	Regular	60	\N	CS000357	\N	2106	100	\N	PC	2026-03-26 16:35:55.589	2026-03-26 16:35:55.589
b64d5a4d-c89d-4712-b4c5-3eab6dd5c022	36f8885a-19b7-43c0-a372-1bed8fc1619f	Regular	85	\N	CS000358	\N	2106	100	\N	PC	2026-03-26 16:35:55.589	2026-03-26 16:35:55.589
78a2610d-ee3a-4c89-a948-a47d998c7d35	3c184a52-e043-4b18-9889-1623d425f739	250g	75	\N	CS000359	\N	2106	100	\N	PC	2026-03-26 16:35:55.589	2026-03-26 16:35:55.589
43aaba99-7c17-4295-9e68-7d6239fd012c	92cdb6e0-a88c-4eef-b46d-703e6b44d7a1	Regular	280	\N	CS000360	\N	2106	20	\N	KG	2026-03-26 16:37:30.017	2026-03-26 16:37:30.017
b97c4c7d-75a3-4390-880b-068a6cae91af	a7a60be1-8ba1-4a75-ad9b-f621541d5e54	Regular	240	\N	CS000361	\N	2106	20	\N	KG	2026-03-26 16:37:30.02	2026-03-26 16:37:30.02
5937697a-2930-4a04-aa4f-51a56efad973	609588a0-c22a-4f7c-b2bb-e4f823aa002e	Regular	55	\N	CS000362	\N	2106	20	\N	KG	2026-03-26 16:37:30.021	2026-03-26 16:37:30.021
a5a2a561-ee2b-4998-9c25-2fa91157812b	46809342-6c6b-4e97-980e-bb40c625c124	Regular	40	\N	CS000363	\N	2201	100	\N	PC	2026-03-26 16:37:30.023	2026-03-26 16:37:30.023
ecdf4c8c-84be-4ec2-8fa0-1bbff84c5963	46809342-6c6b-4e97-980e-bb40c625c124	125ml	10	\N	CS000364	\N	2202	100	\N	PC	2026-03-26 16:37:30.023	2026-03-26 16:37:30.023
2b460a6d-c1c1-4d1f-945a-d2df6f54b215	46809342-6c6b-4e97-980e-bb40c625c124	Regular	20	\N	CS000365	\N	2202	100	\N	PC	2026-03-26 16:37:30.024	2026-03-26 16:37:30.024
040677ba-26c8-409a-8a4b-2275ae554ef3	961f6241-a35b-409e-a52d-f63541bf7c8e	Regular	1600	\N	CS000366	\N	2106	20	\N	KG	2026-03-26 16:37:30.025	2026-03-26 16:37:30.025
40052df3-cfbc-4875-a514-0deaa6332fc9	e7b654aa-94da-4429-a7ce-8440744b4056	Regular	80	\N	CS000367	\N	2106	20	\N	KG	2026-03-26 16:37:30.026	2026-03-26 16:37:30.026
4c7448ed-9ea1-4114-a393-dd9beb202b21	09874618-8dda-4129-8477-c63e8298372a	1l	108	\N	CS000368	\N	2201	100	\N	PC	2026-03-26 16:37:30.029	2026-03-26 16:37:30.029
5c957f8b-366d-45e3-95f8-a9b54f8267bb	d3c6d9a3-2157-404f-a7b4-a65dcc2519fa	1l	130	\N	CS000369	\N	2201	100	\N	PC	2026-03-26 16:37:30.029	2026-03-26 16:37:30.029
83ea28e7-f75e-4d54-863b-d20a7458fc72	9ac215d7-aefa-4d7b-90af-2e974978e0b5	200g	40	\N	CS000370	\N	2106	100	\N	PC	2026-03-26 16:37:30.03	2026-03-26 16:37:30.03
858d52ec-ff21-42ac-837d-4af1e19d288f	529a388b-40f5-441e-98ff-49a18e5a7fe0	250g	290	\N	CS000371	\N	2106	100	\N	PC	2026-03-26 16:37:30.031	2026-03-26 16:37:30.031
075af712-9630-43bc-9f9a-88760d43ff8d	bbc5fb66-ffb8-41ff-a5bf-2544328dd905	150g	40	\N	CS000372	\N	2106	100	\N	PC	2026-03-26 16:37:30.032	2026-03-26 16:37:30.032
dc3a765e-468f-497f-9de8-0d6d0e92a84d	0c34e14b-9b64-4185-b472-74f37d393cc4	200g	30	\N	CS000373	\N	2106	100	\N	PC	2026-03-26 16:37:30.033	2026-03-26 16:37:30.033
44f70544-42ee-440a-b488-a51479d2c7d2	28de2d5c-fee6-4e5c-a389-2d6f82314afb	Regular	25	\N	CS000374	\N	2106	100	\N	PC	2026-03-26 16:37:30.034	2026-03-26 16:37:30.034
fb544043-14c5-42e0-b7d1-b2ea093de7e4	fe20bef7-ebcc-490c-ae7f-e8e68aa22043	200g	40	\N	CS000375	\N	2106	100	\N	PC	2026-03-26 16:37:30.034	2026-03-26 16:37:30.034
29113e53-d388-421b-8f3e-18da916cd282	3ac7da81-8a43-4ff6-abff-12171820c74f	180g	20	\N	CS000376	\N	2106	100	\N	PC	2026-03-26 16:37:30.035	2026-03-26 16:37:30.035
7aefaf3d-2d9c-422b-a75a-c4294b342a62	5a478d2a-72d1-4ee8-a585-7a5d78e4202c	200g	40	\N	CS000377	\N	2106	100	\N	PC	2026-03-26 16:37:30.036	2026-03-26 16:37:30.036
aff77602-b5ca-4ef2-b22b-f64a48d58c5f	7a73d8f1-40e0-4d6c-b12f-2bc6b9ccbeac	200g	70	\N	CS000378	\N	2106	100	\N	PC	2026-03-26 16:37:30.037	2026-03-26 16:37:30.037
3ef34072-0a3b-4ec2-97f6-f5a3ce23f80e	28323096-bc65-4144-b630-b527f14393fa	125g	100	\N	CS000379	\N	2106	100	\N	PC	2026-03-26 16:37:30.038	2026-03-26 16:37:30.038
1137c866-fbde-48b4-8bfc-5dfc52e52311	e71ad1ef-eda9-4783-a90a-2b7c78cf25c7	150g	35	\N	CS000380	\N	2106	100	\N	PC	2026-03-26 16:37:30.039	2026-03-26 16:37:30.039
a3eb8cad-5d5e-4882-8d20-9c9ad78bdbe9	3ed349ec-cd85-40a7-b467-94127cd987c5	150g	35	\N	CS000381	\N	2106	100	\N	PC	2026-03-26 16:37:30.039	2026-03-26 16:37:30.039
5fe4a77c-24f5-4ed5-be62-c8b66b00348d	cd9de66e-850c-44ba-be5a-8ba58e79f192	200g	30	\N	CS000382	\N	2106	100	\N	PC	2026-03-26 16:37:30.04	2026-03-26 16:37:30.04
e1aa241b-9dfc-43f3-9a42-34148c99f723	32132c54-0787-4ceb-8d87-0fbe22c9811f	194g	30	\N	CS000383	\N	2106	100	\N	PC	2026-03-26 16:37:30.04	2026-03-26 16:37:30.04
3b204a26-3534-4d00-b48f-7a95278e964b	d2036eba-a8a0-4a3b-a3fc-9a2486846053	250g	130	\N	CS000384	\N	2106	100	\N	PC	2026-03-26 16:37:30.041	2026-03-26 16:37:30.041
1cd7fdb0-ebfa-4a5a-9cb0-93dd53dbe442	64fd278c-ac59-4386-ba6f-11f02c9486ec	250g	110	\N	CS000385	\N	2106	100	\N	PC	2026-03-26 16:37:30.042	2026-03-26 16:37:30.042
2e6cb4d4-17cd-4f15-aaa2-49123781cbb4	9833bc7b-0a7a-4d0c-a4f6-5f24a2993cc4	250g	155	\N	CS000386	\N	2106	100	\N	PC	2026-03-26 16:37:30.044	2026-03-26 16:37:30.044
a17c1d13-0e27-4fbd-b8e0-34749d4160ff	9429e1db-97f3-4268-8923-53abfe2bd082	250g	150	\N	CS000387	\N	2106	100	\N	PC	2026-03-26 16:37:30.044	2026-03-26 16:37:30.044
729f61d2-e99d-47cf-9b65-a318e31ffcfc	77a33656-9ff1-4492-b1cd-81bbb1c78d64	Regular	110	\N	CS000388	\N	2106	20	\N	KG	2026-03-26 16:37:30.044	2026-03-26 16:37:30.044
29da5e7a-3a3f-4b95-a1ad-aa694e2d2c5c	59610467-74a1-4fbb-97bf-5dad1ae886fe	2L	100	\N	CS000389	\N	2202	100	\N	PC	2026-03-26 16:37:30.045	2026-03-26 16:37:30.045
420cdbfe-949f-4c3c-9fe1-a614311d8a5d	ba09d0e3-27c9-4bab-9d07-a0e8a1ba91d0	Regular	20	\N	CS000390	\N	2202	100	\N	PC	2026-03-26 16:37:30.045	2026-03-26 16:37:30.045
853b7eac-70bb-4a8a-a9d7-0a6cd952e25c	394176a8-74ca-4233-8617-b07f5d0cbc8a	1L	130	\N	CS000391	\N	2202	100	\N	PC	2026-03-26 16:37:30.046	2026-03-26 16:37:30.046
172385f3-e3b8-4ab3-8be9-8983893d9073	6d455cd4-3966-421e-8155-6c6ceca7e71d	700ml	300	\N	CS000392	\N	2105	100	\N	PC	2026-03-26 16:37:30.047	2026-03-26 16:37:30.047
199df108-980e-4f2d-9f77-a6740178d39a	93154c1e-a5d8-4b38-a90a-d603cb506265	750ml	280	\N	CS000393	\N	2105	100	\N	PC	2026-03-26 16:37:30.048	2026-03-26 16:37:30.048
eedf2e7f-8422-46b3-a9a5-2075d400054e	b5e01407-3323-458c-b132-a62a0c448003	Regular	350	\N	CS000394	\N	2105	100	\N	PC	2026-03-26 16:37:30.048	2026-03-26 16:37:30.048
b89e4ff6-4e53-4874-9a37-74fef474f5d7	5ea21618-3fef-4559-acdd-580c68cee745	400g	120	\N	CS000395	\N	2106	100	\N	PC	2026-03-26 16:37:30.049	2026-03-26 16:37:30.049
dab124c4-d69e-4edf-bfc2-e06f39660883	5ea21618-3fef-4559-acdd-580c68cee745	200g	60	\N	CS000396	\N	2106	100	\N	PC	2026-03-26 16:37:30.049	2026-03-26 16:37:30.049
ddbe0cd5-5a74-40c6-a2de-a309ccbcf945	195d1c37-03d3-4d41-8642-8db723cb31bd	Regular	240	\N	CS000397	\N	2106	20	\N	KG	2026-03-26 16:37:30.049	2026-03-26 16:37:30.049
bd31c0cd-e70f-4ad8-8769-6a98b92fe93c	753c82cc-99f8-4bdf-bc85-3654e49c2e69	400g	120	\N	CS000398	\N	2106	100	\N	PC	2026-03-26 16:37:30.05	2026-03-26 16:37:30.05
e8cf4475-830f-45f4-9df0-1d3c79185ebc	753c82cc-99f8-4bdf-bc85-3654e49c2e69	200g	60	\N	CS000399	\N	2106	100	\N	PC	2026-03-26 16:37:30.05	2026-03-26 16:37:30.05
fed0d155-3e87-43ff-bbce-ff778c7cd51a	3a134ff2-32fc-4e14-b632-ef7dd395a81b	Regular	300	\N	CS000400	\N	2106	20	\N	KG	2026-03-26 16:37:30.051	2026-03-26 16:37:30.051
c48efbea-c7ce-4e75-815e-da3245c23daf	95c91fc2-691a-452d-a0b7-77d85054a922	Regular	800	\N	CS000401	\N	2106	20	\N	KG	2026-03-26 16:37:30.051	2026-03-26 16:37:30.051
52a438ab-6da7-42e5-932e-e2224102bf23	c113a1a6-ba9a-4c01-9215-f3528492e357	Regular	850	\N	CS000402	\N	2106	20	\N	KG	2026-03-26 16:37:30.053	2026-03-26 16:37:30.053
a0b1ebf9-8433-4c13-b737-932a746462ef	2ae2e11f-6239-4ee4-8c43-6fdc9171634f	Regular	220	\N	CS000403	\N	2106	20	\N	KG	2026-03-26 16:37:30.053	2026-03-26 16:37:30.053
de80792f-2d32-4205-b258-bc3f41f28a15	cc0c6d8f-42d2-4712-b17f-0acc9a820a60	Regular	130	\N	CS000404	\N	2106	20	\N	KG	2026-03-26 16:37:30.054	2026-03-26 16:37:30.054
2131d32c-c45d-4b8c-9284-4b1b02a39b04	0d201566-c2ff-41bd-981c-6af1c0c040c9	250g	60	\N	CS000405	\N	2106	100	\N	PC	2026-03-26 16:37:30.055	2026-03-26 16:37:30.055
86793558-0863-467a-8896-5bf9721bc9d0	3605be0f-3daa-499b-afe9-c7b0dbfd6326	Regular	60	\N	CS000406	\N	2106	100	\N	PC	2026-03-26 16:37:30.055	2026-03-26 16:37:30.055
eaf0acda-1dca-488c-a42c-63157807b70c	9286fed3-2620-40d3-a1a2-f27a5456896d	Regular	20	\N	CS000407	\N	2106	100	\N	PC	2026-03-26 16:37:30.056	2026-03-26 16:37:30.056
5df48bce-50a2-4796-90d2-285c7a7982cc	d1075f55-15ea-452b-8546-e5a398394e95	400g	135	\N	CS000408	\N	2106	100	\N	PC	2026-03-26 16:37:30.056	2026-03-26 16:37:30.056
b8ae16b6-7f53-4c76-8bcb-672fd88fa09f	ae37f25b-50f9-492d-9c64-6dde72f48dfc	Regular	480	\N	CS000409	\N	2106	20	\N	KG	2026-03-26 16:37:30.057	2026-03-26 16:37:30.057
3e57d3f9-f15a-486c-8de0-b4e086250d26	bb73ea89-fa59-4323-91a6-f549c38e4b9a	Regular	300	\N	CS000410	\N	2106	20	\N	KG	2026-03-26 16:37:30.057	2026-03-26 16:37:30.057
23c0f1a9-4613-4efe-b0ed-c87e76ecabb3	fdc1c850-a241-464a-afa8-b8f7f1062b7d	Regular	440	\N	CS000411	\N	2106	20	\N	KG	2026-03-26 16:37:30.058	2026-03-26 16:37:30.058
d1ba3c37-6aa3-4693-a9a7-17f1552a1918	ac276b58-ce52-4857-843e-d4fd2fd6b297	250g	550	\N	CS000412	\N	1904	100	\N	PC	2026-03-26 16:37:30.058	2026-03-26 16:37:30.058
cea5ad89-26f2-4447-ad88-4bae262d3753	c8a806d5-65d5-4774-a13a-e894571c8c29	400g	400	\N	CS000413	\N	1904	100	\N	PC	2026-03-26 16:37:30.059	2026-03-26 16:37:30.059
930f5d18-f9ef-4fd4-95c3-e4f0e821af6d	4f58cf5b-e828-4073-9501-f59014100963	250g	160	\N	CS000414	\N	1904	100	\N	PC	2026-03-26 16:37:30.059	2026-03-26 16:37:30.059
e5b540ac-85df-4bfc-8337-a8b52ec7f58d	22c549a1-d555-41ed-bd5a-8c8faf3d1580	250g	260	\N	CS000415	\N	1904	100	\N	PC	2026-03-26 16:37:30.059	2026-03-26 16:37:30.059
2a275bbc-28ee-4abf-9760-4fc883caac1c	37876b8e-9a05-4add-a966-8e7a69759028	500g	450	\N	CS000416	\N	1904	100	\N	PC	2026-03-26 16:37:30.06	2026-03-26 16:37:30.06
e270cd3c-c943-451a-9d1a-cb1240f358c6	3939caf8-9953-4817-88a4-0efa448c161b	250g	380	\N	CS000417	\N	1904	100	\N	PC	2026-03-26 16:37:30.06	2026-03-26 16:37:30.06
bc17de74-6075-43aa-a0f7-4dc316f2937d	5d1e79a2-af75-4835-8904-5eca9d5e7e01	Regular	10	\N	CS000418	\N	2105	100	\N	PC	2026-03-26 16:37:30.06	2026-03-26 16:37:30.06
1b976726-0751-4079-a6d0-c5b220b82c5c	329635f2-a212-402f-9de0-54cac4e7f1a1	Regular	10	\N	CS000419	\N	2105	100	\N	PC	2026-03-26 16:37:30.061	2026-03-26 16:37:30.061
98e65433-429c-402d-974f-3b837de3b2b1	968b6352-912f-4188-9dd6-bcd904e215c1	Regular	35	\N	CS000420	\N	2105	100	\N	PC	2026-03-26 16:37:30.061	2026-03-26 16:37:30.061
85d14585-e70f-4fa2-87ad-4ff7c7f8aba0	b44cab82-45c0-40b3-ad6a-844091654f5e	Regular	40	\N	CS000421	\N	2105	100	\N	PC	2026-03-26 16:37:30.062	2026-03-26 16:37:30.062
f17801a7-bd70-4219-8c17-d5ba33359ae3	3fba1199-ee40-4a76-8494-cb46825cbcec	Regular	50	\N	CS000422	\N	2105	100	\N	PC	2026-03-26 16:37:30.062	2026-03-26 16:37:30.062
4051207f-42e0-4cb6-ab60-d503f11db11c	c3a1f8eb-4e0a-447b-96c0-5477c6fd0761	Regular	600	\N	CS000423	\N	2106	20	\N	KG	2026-03-26 16:37:30.062	2026-03-26 16:37:30.062
e41d37d3-83e3-4c89-bfa8-3a405cb79802	3638b745-491c-4205-bf86-d3ae376a4d79	Regular	400	\N	CS000424	\N	2106	20	\N	KG	2026-03-26 16:37:30.063	2026-03-26 16:37:30.063
a84c5b29-f4b7-488b-8a37-a5d1498cbb7f	a994464b-8c0d-4195-a902-9a944b846f5d	Regular	35	\N	CS000425	\N	996331	100	\N	PC	2026-03-26 16:37:30.063	2026-03-26 16:37:30.063
e6a6d60c-22fb-4293-b542-648b65f0d211	9f178f84-ad33-44b2-9eef-c3a42de90ce7	Regular	82	\N	CS000426	\N	2106	100	\N	PC	2026-03-26 16:37:30.064	2026-03-26 16:37:30.064
a1a3096e-face-44d0-874a-e2402b97be14	9f178f84-ad33-44b2-9eef-c3a42de90ce7	50g	10	\N	CS000427	\N	210690	100	\N	PC	2026-03-26 16:37:30.064	2026-03-26 16:37:30.064
524c21db-e294-44db-8dbd-8568f6f10c7b	3297c65a-cf8a-4296-8648-1d4fbeaa8648	Regular	640	\N	CS000428	\N	2106	20	\N	KG	2026-03-26 16:37:30.064	2026-03-26 16:37:30.064
ed774301-d76f-42e6-a9d1-2426d5a13458	26b46b7a-8897-4017-a4d8-dd19024ad3ab	250g	300	\N	CS000429	\N	1904	100	\N	PC	2026-03-26 16:37:30.065	2026-03-26 16:37:30.065
7cf15ffc-3ed9-4af6-9518-ff235afd466d	26b46b7a-8897-4017-a4d8-dd19024ad3ab	Regular	1200	\N	CS000430	\N	1904	20	\N	KG	2026-03-26 16:37:30.065	2026-03-26 16:37:30.065
58905ac2-9cd0-4499-a439-5920884a243a	bb61cb90-228a-49e7-b961-a85c03043966	Regular	680	\N	CS000431	\N	2106	20	\N	KG	2026-03-26 16:37:30.065	2026-03-26 16:37:30.065
675330e6-4f2a-4b4c-a394-ef63fa6b563d	f64fb85d-dd74-422c-a34b-87d13c283944	Regular	680	\N	CS000432	\N	2106	20	\N	KG	2026-03-26 16:37:30.066	2026-03-26 16:37:30.066
549232b7-d11d-4800-8c50-345cc1dffdf3	84046e41-bbdb-4999-825b-b15296e51a6a	Regular	20	\N	CS000433	\N	2106	100	\N	PC	2026-03-26 16:37:30.066	2026-03-26 16:37:30.066
4f26fd5a-0486-4d1d-a79d-db91d8a20626	eb6d19cb-3fc8-4f32-9166-fa09a102d47d	Regular	20	\N	CS000434	\N	996331	100	\N	PC	2026-03-26 16:37:30.067	2026-03-26 16:37:30.067
a2bacadd-6547-4542-a6d4-84a2e7ddf23c	43a9efb5-6876-4619-9031-91e88dc75473	Regular	30	\N	CS000435	\N	996331	100	\N	PC	2026-03-26 16:37:30.067	2026-03-26 16:37:30.067
24d01857-e2e2-4fad-950e-6f46cdb2844d	6ffe7786-2cb3-4902-9bee-ab3ac0d40c77	Regular	30	\N	CS000436	\N	996331	100	\N	PC	2026-03-26 16:37:30.067	2026-03-26 16:37:30.067
474ea23f-afcb-4baf-b788-8fe456c577f1	663ead26-773c-468d-8cab-8f2f467a2338	Regular	95	\N	CS000437	\N	2106	100	\N	PC	2026-03-26 16:37:30.068	2026-03-26 16:37:30.068
11766ade-3385-4cc6-bc74-5b5807e2c900	89abc180-af78-4e85-99a0-1f34cedbafbe	Regular	80	\N	CS000438	\N	2106	100	\N	PC	2026-03-26 16:37:30.068	2026-03-26 16:37:30.068
75be9bc9-d2cf-481d-b535-c24d57a840da	8d6f1ab3-2d8f-4216-8c63-ccd29077f631	250g	170	\N	CS000439	\N	2106	100	\N	PC	2026-03-26 16:37:30.069	2026-03-26 16:37:30.069
e198de4b-3a15-4762-bfa8-22ad85a8005a	c72d9f44-1156-432b-9120-fed22f7a4ad5	250g	180	\N	CS000440	\N	2106	100	\N	PC	2026-03-26 16:37:30.069	2026-03-26 16:37:30.069
9af33985-2c5c-4a7e-a210-3398c01fca22	463bf74b-b3b3-478b-8cca-c4060e1b4ac8	250g	170	\N	CS000441	\N	2106	100	\N	PC	2026-03-26 16:37:30.069	2026-03-26 16:37:30.069
239019b2-6bf3-49f3-b6d5-71748b71eb54	22ca264f-0bc5-40ff-8852-a828a1831f2a	200g	90	\N	CS000442	\N	2106	100	\N	PC	2026-03-26 16:37:30.07	2026-03-26 16:37:30.07
8dd7e526-f94c-4b1d-9a6a-c2647fa8ed42	2f6f2d18-ac24-435b-a2c6-f1fbdd78c37e	500g	175	\N	CS000443	\N	2106	100	\N	PC	2026-03-26 16:37:30.071	2026-03-26 16:37:30.071
9503de33-8fff-480e-a9fe-afb11f450902	2f6f2d18-ac24-435b-a2c6-f1fbdd78c37e	100g	46	\N	CS000444	\N	2106	100	\N	PC	2026-03-26 16:37:30.071	2026-03-26 16:37:30.071
48bf6b8f-1ca8-4e2b-9182-0721946f6cc7	6910af9b-1b2b-47e8-9332-b5ed62a48c63	400g	160	\N	CS000446	\N	2106	100	\N	PC	2026-03-26 16:37:30.072	2026-03-26 16:37:30.072
5357b98d-92d4-4a97-84d5-8aa5c2f21cce	2b7714b8-e0c9-49fa-bcb9-637e64dba8cd	400ml	20	\N	CS000447	\N	2202	100	\N	PC	2026-03-26 16:37:30.073	2026-03-26 16:37:30.073
e1be5141-8d2f-4a99-9989-a1a6c404f303	2b7714b8-e0c9-49fa-bcb9-637e64dba8cd	750ml	40	\N	CS000448	\N	2202	100	\N	PC	2026-03-26 16:37:30.073	2026-03-26 16:37:30.073
df6970c5-0bb8-4bee-b274-e4dd6c3f64cf	b47624b9-133c-4c34-b030-f447f2ff2892	400g	235	\N	CS000449	\N	2106	100	\N	PC	2026-03-26 16:37:30.073	2026-03-26 16:37:30.073
c842a905-aec1-4a9f-bf57-0518e6d255af	8b49fdc8-dfc3-4d10-8af1-45bcd110ace3	25L	100	\N	CS000451	\N	2202	100	\N	PC	2026-03-26 16:37:30.074	2026-03-26 16:37:30.074
d4f22522-0c2f-4c7a-816e-e011c8c0a6c3	61d8cb82-f806-4a91-9c7f-8a747321ee9c	25L	90	\N	CS000453	\N	2202	100	\N	PC	2026-03-26 16:37:30.074	2026-03-26 16:37:30.074
a10b2b9c-ecf9-4fd5-88f0-5ff09e359a91	fde83cb6-6bfb-4552-a9ba-8ce1f5a25f08	Regular	180	\N	CS000454	\N	2106	100	\N	PC	2026-03-26 16:37:30.075	2026-03-26 16:37:30.075
4c17a32d-6022-4451-98d2-9fa1f1e368b5	f3eb6eac-2334-48aa-987e-bd0cf4d2ae8f	200ml	30	\N	CS000455	\N	2202	100	\N	PC	2026-03-26 16:37:30.075	2026-03-26 16:37:30.075
98acf11c-68d1-41e9-8cc8-6abb8ecec197	c5ca42cb-6d6f-4b54-9b78-afb05d2e676e	250g	130	\N	CS000456	\N	2106	100	\N	PC	2026-03-26 16:37:30.076	2026-03-26 16:37:30.076
31873641-ed29-487b-8481-c75afc7efd32	eda6d365-cc4e-4d7d-be50-098a32caa016	Regular	60	\N	CS000457	\N	1905	100	\N	PC	2026-03-26 16:37:30.076	2026-03-26 16:37:30.076
5696fa3d-45a2-4a55-8c68-2adaa9cebd51	9cc6270b-f399-465f-86c8-2c3785e85b59	400g	220	\N	CS000458	\N	1905	100	\N	PC	2026-03-26 16:37:30.076	2026-03-26 16:37:30.076
2c195f93-f1bc-43b1-9103-230f12bc5c34	28b5c164-9d13-487c-a76a-832a2a71379e	250g	105	\N	CS000459	\N	2106	100	\N	PC	2026-03-26 16:37:30.077	2026-03-26 16:37:30.077
31ffceda-36f7-4d86-aafa-8054bee6db10	24f2ce54-050d-469b-9f76-86d01a66139d	250g	40	\N	CS000460	\N	2106	100	\N	PC	2026-03-26 16:37:30.077	2026-03-26 16:37:30.077
16843992-f022-4e52-aa44-b2db63c8e6ca	caa9bcc6-60dc-4a77-87bc-777764c0fe1a	400g	85	\N	CS000461	\N	2106	100	\N	PC	2026-03-26 16:37:30.078	2026-03-26 16:37:30.078
3da9bfc2-9b10-41a4-8c1a-770aa0386492	b575e965-9121-48c2-83e3-e2ad162926f4	Regular	50	\N	CS000462	\N	2105	100	\N	PC	2026-03-26 16:37:30.078	2026-03-26 16:37:30.078
900bc921-0de6-4f7a-a6fb-e33489626254	75536682-f579-4b86-b5be-99527bb3ef88	250g	40	\N	CS000463	\N	2106	100	\N	PC	2026-03-26 16:37:30.078	2026-03-26 16:37:30.078
64fad905-557a-4c50-93ab-292c943f6104	9776b5bf-77c4-43b4-99ad-2369a49c6bea	Regular	50	\N	CS000464	\N	2105	100	\N	PC	2026-03-26 16:37:30.079	2026-03-26 16:37:30.079
c2ef3766-c09f-4e03-a989-6a62145b09c5	9514bcc7-574b-406a-8e0b-0c032369c9f1	Regular	60	\N	CS000465	\N	2105	100	\N	PC	2026-03-26 16:37:30.08	2026-03-26 16:37:30.08
6da98f07-9160-481b-8300-cc942db4b23a	e2fc4dc6-fd0e-4155-abfe-c525a2c95150	Regular	35	\N	CS000466	\N	2105	100	\N	PC	2026-03-26 16:37:30.08	2026-03-26 16:37:30.08
54051632-f3a3-4d04-aab0-f16c314c2631	41265fd3-b120-465b-96dc-a8037c8c8422	Regular	30	\N	CS000467	\N	2105	100	\N	PC	2026-03-26 16:37:30.08	2026-03-26 16:37:30.08
a3a51516-e524-4e40-a325-34c6e8d8dc1e	6fd07b55-2e47-405c-bbcb-24af019efab4	Regular	115	\N	CS000468	\N	2105	100	\N	PC	2026-03-26 16:37:30.081	2026-03-26 16:37:30.081
c4529ce1-12ea-41f9-bd5b-8a9f7526a20d	4410b45d-d429-47ca-b1cd-ceae8c3487eb	120g	95	\N	CS000469	\N	2106	100	\N	PC	2026-03-26 16:37:30.082	2026-03-26 16:37:30.082
b1042491-e1e9-4469-891b-eeaa9cbd8e95	33f3ddb6-3c4c-4662-b37b-08e0c2dd93ae	135g	85	\N	CS000470	\N	2106	100	\N	PC	2026-03-26 16:37:30.082	2026-03-26 16:37:30.082
5d84e9a8-7582-4cbb-918d-b5d1224f4d85	a2dbf2e9-e048-401e-9373-655b0570a430	110g	95	\N	CS000471	\N	2106	100	\N	PC	2026-03-26 16:37:30.082	2026-03-26 16:37:30.082
ed06ec24-0c1e-417e-8487-78f017b5c6a7	38f30993-a4dc-4e59-aec5-b8f85fbb0d64	100g	90	\N	CS000472	\N	2106	100	\N	PC	2026-03-26 16:37:30.083	2026-03-26 16:37:30.083
4166d8d2-9fb0-4cee-911d-d45b9af1342e	06a6475e-f9ec-4e87-856e-cbe50f169d9f	120g	95	\N	CS000473	\N	2106	100	\N	PC	2026-03-26 16:37:30.083	2026-03-26 16:37:30.083
a2079cc3-4dc2-4e51-a9d6-3f33e041cd71	0dea3ac4-6a19-4a1d-9c0d-ad75400857e3	150g	30	\N	CS000474	\N	2106	100	\N	PC	2026-03-26 16:37:30.083	2026-03-26 16:37:30.083
182ae9bd-9565-44be-93bd-ab7799f1d04c	96089537-5127-46cc-ae54-6bbdd974f8c2	Regular	340	\N	CS000475	\N	2106	20	\N	KG	2026-03-26 16:37:30.084	2026-03-26 16:37:30.084
fcd6b6e3-df97-40d5-94d4-8cd592f6c340	07ee3693-ed77-4615-9a00-1a3e872855e0	150g	40	\N	CS000476	\N	2106	100	\N	PC	2026-03-26 16:37:30.084	2026-03-26 16:37:30.084
bfd1e69d-b2af-4455-99ad-5bb18be42870	4d429cfc-0922-402e-80e0-155316cec33a	200g	55	\N	CS000477	\N	2106	100	\N	PC	2026-03-26 16:37:30.084	2026-03-26 16:37:30.084
d76fe90c-d979-4726-b967-efc0b8469fa4	86c40ce9-1a7d-4f81-8259-69f77191642c	150g	70	\N	CS000478	\N	2106	100	\N	PC	2026-03-26 16:37:30.085	2026-03-26 16:37:30.085
455d4451-1d69-47c1-bc7f-d06e6dba49f4	934d1028-9bd8-4eba-9422-978e979f4363	200g	57	\N	CS000479	\N	2106	100	\N	PC	2026-03-26 16:37:30.085	2026-03-26 16:37:30.085
acf236f5-3d58-49e1-8f5e-836aa40983ef	35ca212e-e088-424b-8640-267aa8f216d7	140g	75	\N	CS000480	\N	2106	100	\N	PC	2026-03-26 16:37:30.086	2026-03-26 16:37:30.086
6111cd83-0f5b-4113-a276-5c5e4ce60ece	158e7ead-641a-453c-9856-be830e938108	400g	120	\N	CS000481	\N	2106	100	\N	PC	2026-03-26 16:37:30.086	2026-03-26 16:37:30.086
91662db3-83bf-4924-891a-1ec95840cb9c	b0d8bcd6-da49-4b5a-b7a5-1be20f8b5d96	Regular	1000	\N	CS000482	\N	2106	20	\N	KG	2026-03-26 16:37:30.086	2026-03-26 16:37:30.086
902e024a-95b1-48b4-a598-013d72c0f6b5	258852a2-9937-46b7-8251-8e9767a017d4	Regular	1480	\N	CS000483	\N	2106	20	\N	KG	2026-03-26 16:37:30.087	2026-03-26 16:37:30.087
37bb98d0-886a-42a8-b176-83a50318583d	1402026f-ca72-49a5-9942-389feaec0da2	200g	60	\N	CS000484	\N	2106	100	\N	PC	2026-03-26 16:37:30.087	2026-03-26 16:37:30.087
96803f05-8e2c-45d1-aeaa-9e6dc9cc0803	7eae12f1-40b7-4765-a1fa-8df3d06dc12c	Regular	1080	\N	CS000485	\N	2106	20	\N	KG	2026-03-26 16:37:30.087	2026-03-26 16:37:30.087
b270a045-d6d0-49c5-a14d-dc26b6450677	4c093ab5-b7c6-4a12-935c-14044b590c41	1L	108	\N	CS000488	\N	2202	100	\N	PC	2026-03-26 16:37:30.088	2026-03-26 16:37:30.088
de9be6e4-bd9a-4b00-9357-e045ca9ae87d	d364d7cd-5a77-433f-8578-4081a51d3264	Regular	112	\N	CS000489	\N	2202	100	\N	PC	2026-03-26 16:37:30.089	2026-03-26 16:37:30.089
e49ff70d-5514-4a31-b5c4-8d8900d993e5	e721df39-d0e6-4923-add8-ff001513ef4e	1L	80	\N	CS000490	\N	2202	100	\N	PC	2026-03-26 16:37:30.089	2026-03-26 16:37:30.089
6da89633-f06f-454b-a1ee-0648795c0afb	098a1dcc-e092-4545-a290-1d036cc0a1b1	Regular	122	\N	CS000491	\N	2202	100	\N	PC	2026-03-26 16:37:30.089	2026-03-26 16:37:30.089
7dcc1349-6248-4986-b7f9-eb6363546e1c	6a26c4e6-99d0-4fbd-b8ba-286b0d5c31c2	98g	20	\N	CS000492	\N	210690	100	\N	PC	2026-03-26 16:37:30.09	2026-03-26 16:37:30.09
20d1ada3-8965-4e1e-ada3-ee76af08586b	ac5c0343-02bf-4fa6-8d1d-181196c2e42f	59g	20	\N	CS000493	\N	210690	100	\N	PC	2026-03-26 16:37:30.09	2026-03-26 16:37:30.09
910a9c18-5c87-475c-b8ad-11f56a838b50	4e952297-1281-4780-a660-080cebaf7c62	100g	20	\N	CS000494	\N	210690	100	\N	PC	2026-03-26 16:37:30.09	2026-03-26 16:37:30.09
ee55060f-8f78-4eaa-a624-96c98b325534	91ba974c-59d3-45fb-ae33-75e4e68cd145	345ml	20	\N	CS000495	\N	2202	100	\N	PC	2026-03-26 16:37:30.091	2026-03-26 16:37:30.091
e88a8338-f4aa-4c14-8968-40a6c43c8f81	4189e0e4-5409-4e27-af38-8d6257f5ede1	59g	20	\N	CS000496	\N	210690	100	\N	PC	2026-03-26 16:37:30.091	2026-03-26 16:37:30.091
463488aa-89ed-45a6-a4df-a53f7ac848e5	757141ec-9949-413c-acbb-53d36ac85211	25L	100	\N	CS000497	\N	2202	100	\N	PC	2026-03-26 16:37:30.091	2026-03-26 16:37:30.091
32ab01f2-1747-46f9-8725-25ec3f0bc29b	c7155cfb-a694-4b57-98a2-ec7171dcb44a	250ml	60	\N	CS000498	\N	2202	100	\N	PC	2026-03-26 16:37:30.092	2026-03-26 16:37:30.092
db0efc0a-e90e-45e1-b281-acd1cc094073	1926b565-2c8b-4fc4-85b3-4c8236778e9a	180ml	40	\N	CS000499	\N	2202	100	\N	PC	2026-03-26 16:37:30.092	2026-03-26 16:37:30.092
06be7f36-f337-4311-a253-c5a74e6bb7d5	060c6967-1578-41ee-b6c3-03a10cce10f8	250ml	125	\N	CS000500	\N	2202	100	\N	PC	2026-03-26 16:37:30.092	2026-03-26 16:37:30.092
a72c354f-af74-4d99-b275-62836f897f3d	bb642102-b30b-4bc2-83dd-f1415786ed21	1L	20	\N	CS000501	\N	2201	100	\N	PC	2026-03-26 16:37:30.093	2026-03-26 16:37:30.093
2fca072e-65fa-4828-a484-d4751511d5f4	bb642102-b30b-4bc2-83dd-f1415786ed21	5L	68	\N	CS000502	\N	2201	100	\N	PC	2026-03-26 16:37:30.093	2026-03-26 16:37:30.093
900ffc36-6cd9-49ad-a045-14be64ceb48e	bb642102-b30b-4bc2-83dd-f1415786ed21	2L	30	\N	CS000503	\N	2201	100	\N	PC	2026-03-26 16:37:30.093	2026-03-26 16:37:30.093
030a4563-b23c-4d69-9991-f14de51ef32b	bb642102-b30b-4bc2-83dd-f1415786ed21	500ml	10	\N	CS000504	\N	2201	100	\N	PC	2026-03-26 16:37:30.093	2026-03-26 17:52:00.916
d15a4eb1-7cd5-49e2-9c3c-0be7da3033ad	c165a330-0021-47a9-9bc0-e71710cd2a84	Regular	60	\N	CS000505	\N	2106	100	\N	PC	2026-03-26 16:37:30.094	2026-03-26 16:37:30.094
2a992430-c312-4b49-aa52-23903c19105e	bb642102-b30b-4bc2-83dd-f1415786ed21	1L	20	\N	CS000506	\N	2201	100	\N	PC	2026-03-26 16:37:30.094	2026-03-26 16:37:30.094
d48ca3ee-9944-47bf-aa70-8b2036064861	aca71a65-5414-4c9e-9478-73573dfcd0d2	Regular	30	\N	CS000507	\N	2106	100	\N	PC	2026-03-26 16:37:30.094	2026-03-26 16:37:30.094
1f4eef54-77ad-49b1-91b2-04055463e01d	8524a550-fbc9-4fe5-8fb0-459e1fce5fa6	Regular	60	\N	CS000508	\N	2106	100	\N	PC	2026-03-26 16:37:30.095	2026-03-26 16:37:30.095
b59bc3b0-c5fb-4b2b-98f9-019b00250f67	2a301da4-0eca-48d4-8a32-ed112c43ec08	Regular	35	\N	CS000509	\N	2106	100	\N	PC	2026-03-26 16:37:30.095	2026-03-26 16:37:30.095
59c5326e-8e7b-4618-b904-c3ac631e0d2f	7c53c225-0b30-417d-bed6-6a1f1ab19e64	Regular	16	\N	CS000510	\N	2106	100	\N	PC	2026-03-26 16:37:30.095	2026-03-26 16:37:30.095
c127acb4-782a-4ccd-bd19-e1af30fbc523	ed55133c-1489-4369-a2b1-1d8f3206326b	Regular	440	\N	CS000511	\N	2106	20	\N	KG	2026-03-26 16:37:30.096	2026-03-26 16:37:30.096
4e8b93f1-c737-4d91-9c24-d98b50835d9c	d3fca32a-1038-4ff1-b37a-ce421f65cd61	Regular	680	\N	CS000512	\N	2106	20	\N	KG	2026-03-26 16:37:30.096	2026-03-26 16:37:30.096
27a26a06-5d90-491f-9b8c-42a0409475f2	8addb5f5-f3d1-49da-96b5-5b7a560fc08c	Regular	640	\N	CS000513	\N	2106	20	\N	KG	2026-03-26 16:37:30.096	2026-03-26 16:37:30.096
41cc4007-1d8f-4452-b3c7-537d3b07bed8	b60d32b7-3f31-407a-80eb-b4ec69466c57	Regular	640	\N	CS000514	\N	2106	20	\N	KG	2026-03-26 16:37:30.097	2026-03-26 16:37:30.097
167fd78a-5ee1-4102-80c3-94f4be9d213e	48b42451-40ab-4dc2-92ca-788845ffb69e	Regular	640	\N	CS000515	\N	2106	20	\N	KG	2026-03-26 16:37:30.097	2026-03-26 16:37:30.097
652ae97a-025b-47be-b825-73fff9141faf	25ef752e-7266-4de7-82e9-8a3e2b98285c	Regular	640	\N	CS000516	\N	2106	20	\N	KG	2026-03-26 16:37:30.097	2026-03-26 16:37:30.097
e5a777db-f61c-49cd-a0c9-5849146102ae	f6b01749-420e-4ca9-9609-ec11e66fcd80	Regular	480	\N	CS000517	\N	2106	20	\N	KG	2026-03-26 16:37:30.098	2026-03-26 16:37:30.098
22f48de9-a47b-438a-8e0f-c00f5f260d7e	9c699553-e8d6-4449-a0fa-02269602f5b9	Regular	680	\N	CS000518	\N	2106	20	\N	KG	2026-03-26 16:37:30.098	2026-03-26 16:37:30.098
7f2311f6-41db-4ace-870f-e6d0c2df7c51	8114a5ae-532f-4d86-a4bb-c5ee24d630b3	Regular	480	\N	CS000519	\N	2106	20	\N	KG	2026-03-26 16:37:30.098	2026-03-26 16:37:30.098
c15087de-9d69-492b-88f4-fe2ffb137774	f6b01749-420e-4ca9-9609-ec11e66fcd80	Regular	480	\N	CS000520	\N	2106	20	\N	KG	2026-03-26 16:37:30.098	2026-03-26 16:37:30.098
1f9844de-8e39-4e00-b3c4-ed10707c5d77	30d3d94d-300f-4ee8-aebc-3175cbe8ae2e	Regular	480	\N	CS000521	\N	2106	20	\N	KG	2026-03-26 16:37:30.099	2026-03-26 16:37:30.099
22f1f7c7-4673-4852-b672-021379166706	696667ad-14c9-4070-9fa8-9acfe78653eb	Regular	680	\N	CS000522	\N	2106	20	\N	KG	2026-03-26 16:37:30.099	2026-03-26 16:37:30.099
93243e7f-350d-4115-ae6f-1c123f72c94e	2380ab21-cf36-4a8c-b116-303085828cdb	Regular	380	\N	CS000523	\N	2106	20	\N	KG	2026-03-26 16:37:30.099	2026-03-26 16:37:30.099
88e038a9-9f83-4cee-94b7-e7808140f009	78dc12ea-7c78-4c4c-a66c-256ac318cbb2	Regular	480	\N	CS000524	\N	2106	20	\N	KG	2026-03-26 16:37:30.099	2026-03-26 16:37:30.099
0a4e08ca-3937-4165-97ea-09de2b7936bb	f06dbf63-5305-43bc-8d63-5397804b1fa7	Regular	340	\N	CS000525	\N	1904	20	\N	KG	2026-03-26 16:37:30.1	2026-03-26 16:37:30.1
20d47b3e-a313-42fc-8301-3c0576d5672e	92949727-e7ca-4bfb-b48a-44ce2c2a10cf	Regular	480	\N	CS000526	\N	2106	20	\N	KG	2026-03-26 16:37:30.1	2026-03-26 16:37:30.1
5dd9ef67-4d46-4760-b378-ac0153b86570	81b11fdf-9d15-4f74-a10f-205e44ac966d	Regular	320	\N	CS000527	\N	1904	20	\N	KG	2026-03-26 16:37:30.1	2026-03-26 16:37:30.1
c4b9413d-3b1a-4648-ac69-d2fd6b33dac7	e3564809-bd65-4451-b416-5e86d569efee	250g	320	\N	CS000528	\N	1904	100	\N	PC	2026-03-26 16:37:30.101	2026-03-26 16:37:30.101
82f1583f-2ed2-4fbc-aa81-c08330cec9f6	6748c80a-1355-4193-8d21-d0a69de39cab	250g	150	\N	CS000529	\N	1904	100	\N	PC	2026-03-26 16:37:30.101	2026-03-26 16:37:30.101
61c2f42b-c89e-4399-8079-e7b9cb99c0f5	380665da-a244-482e-b3fa-75c9f05661dc	250g	400	\N	CS000530	\N	1904	100	\N	PC	2026-03-26 16:37:30.101	2026-03-26 16:37:30.101
b53c5e76-97da-4dd1-8229-fd21f9612446	e3564809-bd65-4451-b416-5e86d569efee	100g	140	\N	CS000531	\N	1904	100	\N	PC	2026-03-26 16:37:30.102	2026-03-26 16:37:30.102
4649577d-4398-4bee-b6b4-e66391ea72ba	1f178c92-0a3e-49ed-841d-d15ba969461e	250g	350	\N	CS000532	\N	1904	100	\N	PC	2026-03-26 16:37:30.102	2026-03-26 16:37:30.102
fa7dbba8-4a5b-4f83-90f7-acac5860f0e8	6c3a9bc5-090a-437e-8c72-8facc394bcb6	Regular	150	\N	CS000533	\N	2105	100	\N	PC	2026-03-26 16:37:30.102	2026-03-26 16:37:30.102
ccd3c199-939b-43a9-af8d-5e7fd715f576	24a886f2-6394-4d5b-ac5c-f7a35ca253ec	Regular	70	\N	CS000534	\N	0401	100	\N	PC	2026-03-26 16:37:30.103	2026-03-26 16:37:30.103
b46301c9-e1ea-439e-9c65-84de5f2c96e6	b448c4fe-3699-4547-8ed0-7ab026783c2d	Regular	25	\N	CS000535	\N	2105	100	\N	PC	2026-03-26 16:37:30.103	2026-03-26 16:37:30.103
fe323575-d6cd-44d5-a9dc-5b39d9d906c3	b3c35dad-5153-4156-89ac-f1058d77404c	Regular	30	\N	CS000536	\N	2105	100	\N	PC	2026-03-26 16:37:30.103	2026-03-26 16:37:30.103
2568e0f8-2396-41ae-a3d3-a84137441e85	a135657f-4fa0-4ea4-835c-fa79518af720	180g	50	\N	CS000537	\N	2106	100	\N	PC	2026-03-26 16:37:30.104	2026-03-26 16:37:30.104
8e9e514f-7423-4edf-9fb5-3dbc4ba97364	75b949a9-8f8b-4aa7-885c-5987d17f8305	200g	62	\N	CS000538	\N	2106	100	\N	PC	2026-03-26 16:37:30.104	2026-03-26 16:37:30.104
b105e8b6-70f1-4833-a915-c2119050e4d5	2c38eebd-14b9-4fe3-ba62-69174f826b35	500g	200	\N	CS000539	\N	2106	100	\N	PC	2026-03-26 16:37:30.104	2026-03-26 16:37:30.104
3ae83c0e-877f-4815-842e-a99c47232aff	75b949a9-8f8b-4aa7-885c-5987d17f8305	Regular	280	\N	CS000540	\N	2106	20	\N	KG	2026-03-26 16:37:30.105	2026-03-26 16:37:30.105
b85a4f5e-012b-4e6a-9203-10970c8867f7	2e00a94b-08b5-4a9a-916e-509f1c891650	200g	62	\N	CS000541	\N	2106	100	\N	PC	2026-03-26 16:37:30.105	2026-03-26 16:37:30.105
f1abd69a-d7bc-4d2e-ac4e-93f3934059aa	75b949a9-8f8b-4aa7-885c-5987d17f8305	250g	50	\N	CS000542	\N	2106	100	\N	PC	2026-03-26 16:37:30.105	2026-03-26 16:37:30.105
286be44e-b13c-4821-9ac6-cd53764578ba	c21ee8af-e209-4c4e-a14a-8460e79984d6	200g	62	\N	CS000543	\N	2106	100	\N	PC	2026-03-26 16:37:30.105	2026-03-26 16:37:30.105
555a7674-8fe6-4139-a497-bae180d4e486	c21ee8af-e209-4c4e-a14a-8460e79984d6	250g	60	\N	CS000544	\N	2106	100	\N	PC	2026-03-26 16:37:30.105	2026-03-26 16:37:30.105
0652f57f-802f-4088-ae63-938acf1bf1c5	1a313768-69a7-4863-808c-c7a77ac0456d	1kg	275	\N	CS000545	\N	2106	20	\N	KG	2026-03-26 16:37:30.106	2026-03-26 16:37:30.106
01b5342c-9ddb-451a-b7f8-6122acfb2731	61e0d62f-d7e4-41e4-a969-8c1f074dbc85	200g	62	\N	CS000546	\N	2106	100	\N	PC	2026-03-26 16:37:30.106	2026-03-26 16:37:30.106
807a8534-e293-43c9-857a-b2b0c444a647	1a313768-69a7-4863-808c-c7a77ac0456d	600g	165	\N	CS000547	\N	2106	100	\N	PC	2026-03-26 16:37:30.106	2026-03-26 16:37:30.106
724bad2e-a1a0-4117-95a1-9c8ef094cd12	1a313768-69a7-4863-808c-c7a77ac0456d	200g	57	\N	CS000548	\N	2106	100	\N	PC	2026-03-26 16:37:30.106	2026-03-26 16:37:30.106
816e97c4-4ddb-4e84-9d7a-928b0a47973b	d6bcb2d5-8027-49db-9c56-dc2aad8d370c	400g	122	\N	CS000549	\N	2106	100	\N	PC	2026-03-26 16:37:30.107	2026-03-26 16:37:30.107
5a65b4df-ab90-4664-8c5b-2aec38e347e3	8186497e-b237-494d-bd62-5c794b677c15	Regular	15	\N	CS000550	\N	996331	100	\N	PC	2026-03-26 16:37:30.107	2026-03-26 16:37:30.107
92405198-867c-43f7-9c8b-31fa9df4e0ca	91d0a98e-a416-4f75-9941-d6dced5a9e3b	200g	57	\N	CS000551	\N	2106	100	\N	PC	2026-03-26 16:37:30.107	2026-03-26 16:37:30.107
494b52a0-5c34-4fee-b17f-981513283d5e	91d0a98e-a416-4f75-9941-d6dced5a9e3b	400g	115	\N	CS000552	\N	2106	100	\N	PC	2026-03-26 16:37:30.107	2026-03-26 16:37:30.107
e5cb199b-3a2e-4163-860e-28d33e1d3778	07c68e5e-e524-43ef-baf2-746db536a440	Regular	115	\N	CS000553	\N	2105	100	\N	PC	2026-03-26 16:37:30.108	2026-03-26 16:37:30.108
3751ac52-a3a1-4a9e-a013-2e001672573f	41929f46-6e38-42cd-adfb-e22f1bb70233	Regular	175	\N	CS000554	\N	2105	100	\N	PC	2026-03-26 16:37:30.108	2026-03-26 16:37:30.108
a5d576e7-fb4b-4cf8-b22e-f0ee034905a6	a51b703c-e82a-4699-9f63-f693347a61ec	Regular	155	\N	CS000555	\N	2105	100	\N	PC	2026-03-26 16:37:30.108	2026-03-26 16:37:30.108
2aae8f6c-2642-4d14-a37d-69d10b8e458e	e70ff601-aa5a-4ed6-92ef-03006e191a88	Regular	170	\N	CS000556	\N	2105	100	\N	PC	2026-03-26 16:37:30.109	2026-03-26 16:37:30.109
b9f37697-a344-41a6-96fd-d75fbbe32faf	b0807663-9191-4a36-a195-a5efa62bc099	Regular	150	\N	CS000557	\N	2105	100	\N	PC	2026-03-26 16:37:30.109	2026-03-26 16:37:30.109
ac2c42b4-606d-4ac3-b4e7-08f6870fbb0f	6e6ae8cf-c47f-4945-8a38-fe0093620002	Regular	160	\N	CS000558	\N	2105	100	\N	PC	2026-03-26 16:37:30.109	2026-03-26 16:37:30.109
61910dbc-1974-40c8-8a30-9908e03cb0e3	cf13f4d2-5666-4e11-ba95-dfcc4d3c8567	1L	122	\N	CS000559	\N	2202	100	\N	PC	2026-03-26 16:37:30.11	2026-03-26 16:37:30.11
5e164c7e-954d-4b4f-b8b2-350de52678dc	a87e58b2-a82e-4daf-941e-b4bc2c1e0e79	1L	132	\N	CS000560	\N	2202	100	\N	PC	2026-03-26 16:37:30.11	2026-03-26 16:37:30.11
2baa90ae-5a87-43c4-8e7e-4d6c50db316e	e326e5c0-9621-4c69-8ebc-08656c67feca	1L	122	\N	CS000561	\N	2202	100	\N	PC	2026-03-26 16:37:30.11	2026-03-26 16:37:30.11
3383e36b-5ede-4b5e-a802-cc8d5851afe6	ddc3d25f-3019-4c02-9bc3-6c774434e16d	Regular	85	\N	CS000562	\N	2106	100	\N	PC	2026-03-26 16:37:30.111	2026-03-26 16:37:30.111
c0e6b653-cc0f-46cd-b718-37daaa8d88ee	45dd1c0b-fbd6-4ae2-bbab-a83386a9f001	1L	122	\N	CS000563	\N	2202	100	\N	PC	2026-03-26 16:37:30.111	2026-03-26 16:37:30.111
00942510-e1cc-42b8-9cb8-487df1199697	a5fc5ce5-c3d4-4918-a410-afaec477c2f1	Regular	80	\N	CS000564	\N	2106	100	\N	PC	2026-03-26 16:37:30.111	2026-03-26 16:37:30.111
ac4dcbfb-a4d9-4c55-bf29-48628c1547e4	09324567-6084-4d8a-bbe9-d98975559dfe	Regular	600	\N	CS000565	\N	2106	20	\N	KG	2026-03-26 16:37:30.112	2026-03-26 16:37:30.112
3bb3ce01-76d1-46a1-9cf9-3351be4edbd2	dffe6874-c0c4-41a0-aee9-6bcc690de836	Regular	600	\N	CS000566	\N	2106	20	\N	KG	2026-03-26 16:37:30.112	2026-03-26 16:37:30.112
697f460d-199e-4608-84b7-d3dc002083c5	7352acd4-ebd3-4e36-80fa-e26e5c867c12	Regular	1280	\N	CS000567	\N	2106	20	\N	KG	2026-03-26 16:37:30.114	2026-03-26 16:37:30.114
22c99ee9-0447-4f49-a668-2202962476bd	24308bfb-2da3-4970-b37c-30146e01221e	Regular	560	\N	CS000568	\N	2106	20	\N	KG	2026-03-26 16:37:30.115	2026-03-26 16:37:30.115
18d1e0d4-65a7-4aa1-b49d-551c41bdd698	134a7630-c62f-47fd-8347-30de136aecab	Regular	640	\N	CS000569	\N	2106	20	\N	KG	2026-03-26 16:37:30.115	2026-03-26 16:37:30.115
09407942-800e-48e5-b101-4f7d3a55f1a3	bd8efbf0-4b07-49e3-ad6f-e5651322fc45	250ml	20	\N	CS000570	\N	2202	100	\N	PC	2026-03-26 16:37:30.116	2026-03-26 16:37:30.116
5eec2cf5-76d8-4f02-ad5a-87a69d969ef8	bd8efbf0-4b07-49e3-ad6f-e5651322fc45	750ml	90	\N	CS000571	\N	2202	100	\N	PC	2026-03-26 16:37:30.116	2026-03-26 16:37:30.116
b10b2a5a-936b-4d37-b984-84ac0f149e3e	84ae9092-0afa-4bdb-8d23-f8d1887c29b5	Regular	520	\N	CS000572	\N	2106	20	\N	KG	2026-03-26 16:37:30.116	2026-03-26 16:37:30.116
e7d1df8a-58ef-4852-8bbd-adaa62f90b83	bd8efbf0-4b07-49e3-ad6f-e5651322fc45	200ml	30	\N	CS000573	\N	2202	100	\N	PC	2026-03-26 16:37:30.116	2026-03-26 16:37:30.116
99932265-bfe5-4284-891e-3e21f1def77d	bd8efbf0-4b07-49e3-ad6f-e5651322fc45	2L	100	\N	CS000574	\N	2202	100	\N	PC	2026-03-26 16:37:30.116	2026-03-26 16:37:30.116
d49c21f3-a47d-4b81-ac60-f520a227c552	2627b3d7-1d05-4bbe-959e-fdf9803b9e99	250ml	20	\N	CS000575	\N	2202	100	\N	PC	2026-03-26 16:37:30.117	2026-03-26 16:37:30.117
508971cc-fbba-4b1e-a17b-ecc0f767a262	99909606-f9e2-41cc-bac3-10068c667c53	200ml	30	\N	CS000576	\N	2202	100	\N	PC	2026-03-26 16:37:30.117	2026-03-26 16:37:30.117
8e862111-e7c4-466a-a1ee-72b41832be05	2627b3d7-1d05-4bbe-959e-fdf9803b9e99	750ml	90	\N	CS000577	\N	2202	100	\N	PC	2026-03-26 16:37:30.117	2026-03-26 16:37:30.117
f5eeaa60-9571-48c5-8c23-571782ff0ad0	2627b3d7-1d05-4bbe-959e-fdf9803b9e99	2L	100	\N	CS000578	\N	2202	100	\N	PC	2026-03-26 16:37:30.117	2026-03-26 16:37:30.117
7de4248d-77f2-451a-9f41-4a4e64241b84	172d2cb1-9054-4085-8a3d-f891cc8d1b6f	Regular	65	\N	CS000579	\N	2106	100	\N	PC	2026-03-26 16:37:30.118	2026-03-26 16:37:30.118
91756d22-b00c-43e6-9029-7eef9bc9a9d1	9b90d346-8c9f-498c-9701-46dcb3f63d27	400g	105	\N	CS000580	\N	2106	100	\N	PC	2026-03-26 16:37:30.118	2026-03-26 16:37:30.118
4dc56960-3e88-4f39-9538-61c2147fa768	3aee962c-35ed-4be3-93a3-ff35e7ee329f	Regular	30	\N	CS000581	\N	2106	100	\N	PC	2026-03-26 16:37:30.118	2026-03-26 16:37:30.118
af8bb574-e705-45e6-af95-c2a961e08753	39a63727-ad90-4361-8a07-47372f31d8c2	Regular	25	\N	CS000582	\N	2106	100	\N	PC	2026-03-26 16:37:30.119	2026-03-26 16:37:30.119
520fa3a9-a8dc-42a2-8df5-dd2fa0147f58	5ba4ce1f-68ea-4fa4-96fa-b68e44f227c1	Regular	1400	\N	CS000583	\N	1904	20	\N	KG	2026-03-26 16:37:30.119	2026-03-26 16:37:30.119
9a1f1bb6-93f5-4b59-ad1f-c8e4b7f835c6	43e96816-804c-4f04-98fb-dc6c59558d6b	Regular	60	\N	CS000584	\N	2106	100	\N	PC	2026-03-26 16:37:30.119	2026-03-26 16:37:30.119
23178d19-1c7a-47b2-a52a-535daa31ce54	a426de3f-5e58-4802-90d1-f394045a5f35	Regular	480	\N	CS000585	\N	0401	20	\N	KG	2026-03-26 16:37:30.12	2026-03-26 16:37:30.12
fcf77d08-1dee-4343-8cce-dd63ac223222	b419f1fe-2a26-4cdd-aae8-e87c5745ae4e	Regular	20	\N	CS000586	\N	996331	100	\N	PC	2026-03-26 16:37:30.12	2026-03-26 16:37:30.12
62d54ddd-0269-469d-94e9-482f2a958b94	2bd7a322-26fb-4220-bdbf-2dfbe1059e8b	Regular	30	\N	CS000587	\N	996331	100	\N	PC	2026-03-26 16:37:30.12	2026-03-26 16:37:30.12
ca71845f-45ac-4f44-bf97-f60ec546e491	fa693c36-56b7-455f-8209-3812eeb51207	Regular	120	\N	CS000588	\N	2106	20	\N	KG	2026-03-26 16:37:30.12	2026-03-26 16:37:30.12
d3a33b2b-8e08-458f-9e5a-99e960853aed	efef0802-3935-4a10-8bbb-4d9a6bce6cb0	250g	160	\N	CS000589	\N	1905	100	\N	PC	2026-03-26 16:37:30.121	2026-03-26 16:37:30.121
4c45869f-af91-40f1-b334-76706d86ed89	33095f31-7690-437c-b1d2-d62cbd754181	230g	170	\N	CS000590	\N	1905	100	\N	PC	2026-03-26 16:37:30.121	2026-03-26 16:37:30.121
b7518aa3-e5db-4985-9af5-cbffe80c8b79	6d120581-550e-4ad8-a99f-a6d4aa32a102	250g	130	\N	CS000591	\N	1905	100	\N	PC	2026-03-26 16:37:30.121	2026-03-26 16:37:30.121
b09e363c-2769-462a-b8cc-8a397c2ff746	0c454422-3525-4882-a7d7-c1021c705732	180ml	30	\N	CS000592	\N	2202	100	\N	PC	2026-03-26 16:37:30.122	2026-03-26 16:37:30.122
9c3c6d80-69a1-4e88-9848-adcdd0cd76ae	1bef6ac3-0e43-4461-8870-c63cc51d6ec8	125ml	10	\N	CS000593	\N	2202	100	\N	PC	2026-03-26 16:37:30.122	2026-03-26 16:37:30.122
893ad677-4ca1-4d09-8444-fb471b559677	c7cb4ef2-863f-440b-b325-60184de87819	400ml	20	\N	CS000595	\N	2202	100	\N	PC	2026-03-26 16:37:30.123	2026-03-26 16:37:30.123
f1815d24-b3f5-4857-a428-4aad0bb34a23	89eb8225-6e7e-486a-8b19-296ef382b1cd	180ml	20	\N	CS000596	\N	2202	100	\N	PC	2026-03-26 16:37:30.123	2026-03-26 16:37:30.123
5dad73d3-ed83-41c0-8b8b-832b29f126f4	95b50642-92d3-45dd-8c49-d0c2bb51f9c1	180ml	30	\N	CS000597	\N	2202	100	\N	PC	2026-03-26 16:37:30.123	2026-03-26 16:37:30.123
145fdc84-5696-47ed-827a-515c33675153	c7cb4ef2-863f-440b-b325-60184de87819	750ml	40	\N	CS000598	\N	2202	100	\N	PC	2026-03-26 16:37:30.124	2026-03-26 16:37:30.124
474b5e84-d878-49f3-baae-3426d8d6e589	373ae1c9-b118-4a16-90f6-5632c6d562f3	1L	50	\N	CS000599	\N	2202	100	\N	PC	2026-03-26 16:37:30.124	2026-03-26 16:37:30.124
05e34380-d407-4885-a9b0-8e496f14a8b6	373ae1c9-b118-4a16-90f6-5632c6d562f3	2L	100	\N	CS000600	\N	2202	100	\N	PC	2026-03-26 16:37:30.124	2026-03-26 16:37:30.124
0bba1adb-968f-4282-9ebc-e0bf0fa51cd0	6293d559-c68c-49d4-a0d6-1bb415f48d66	Regular	30	\N	CS000601	\N	2201	100	\N	PC	2026-03-26 16:37:30.124	2026-03-26 16:37:30.124
c0ab4ba3-4ae2-41dc-aea5-c5b64d557ea5	c55afd12-27cf-4ba4-b709-7d49ad0af536	148g	40	\N	CS000602	\N	1905	100	\N	PC	2026-03-26 16:37:30.125	2026-03-26 16:37:30.125
dee9afef-5200-4f4c-9c1e-1250ea0f6890	dcbb2ec6-b02c-4d06-8c9c-25bd37c47f68	208g	30	\N	CS000603	\N	1905	100	\N	PC	2026-03-26 16:37:30.125	2026-03-26 16:37:30.125
a04d3b63-9b67-42fb-9921-77b2a6c57000	858f7437-5c70-43f9-bb05-aef001ca6fd2	25L	50	\N	CS000604	\N	2202	100	\N	PC	2026-03-26 16:37:30.126	2026-03-26 16:37:30.126
2e8a73bb-eadf-4fa3-a278-13e5e73f5b7e	f16e1fee-fea8-4e50-8294-d733b70ef67e	200g	45	\N	CS000605	\N	2106	100	\N	PC	2026-03-26 16:37:30.126	2026-03-26 16:37:30.126
917516ee-d946-410d-8002-544baced8b3d	c3e91cd0-c2e3-4a1c-93ae-3656861240fc	Regular	480	\N	CS000606	\N	2106	20	\N	KG	2026-03-26 16:37:30.126	2026-03-26 16:37:30.126
acfcfac1-0a70-4617-a197-b67f257f6b27	56cce2ec-49de-4e5d-925c-6f6144fe7eef	Regular	480	\N	CS000607	\N	2106	20	\N	KG	2026-03-26 16:37:30.127	2026-03-26 16:37:30.127
5fb5fc1a-93f9-45c1-9af8-fe8485dad610	d2857216-1596-4fab-831d-791e9291168f	Regular	560	\N	CS000608	\N	2106	20	\N	KG	2026-03-26 16:37:30.127	2026-03-26 16:37:30.127
a69b121d-1d1f-4de1-b92d-ee5173d318ff	c984a2a0-51e2-48c9-855e-e3f06b9e785b	250g	50	\N	CS000609	\N	2106	100	\N	PC	2026-03-26 16:37:30.127	2026-03-26 16:37:30.127
6f9b00b1-e60c-4391-ab97-acd53b2d1f18	799a99e6-c82c-4525-ad7a-d02cdf4efad3	250g	50	\N	CS000610	\N	2106	100	\N	PC	2026-03-26 16:37:30.128	2026-03-26 16:37:30.128
2cdac890-5a6f-4fec-9e49-653c39b0972a	e09fdb5d-494d-475b-b027-8007d2bd9df5	250g	50	\N	CS000611	\N	2106	100	\N	PC	2026-03-26 16:37:30.128	2026-03-26 16:37:30.128
6839ee0e-f1ab-4e4d-b360-1f96b85d2c70	9ec0e1d6-6c21-49e6-be91-16d98ee61e7c	250g	60	\N	CS000612	\N	2106	100	\N	PC	2026-03-26 16:37:30.128	2026-03-26 16:37:30.128
3fdbb759-af96-486b-8ef7-0ee400953e12	64e0d892-b0d7-455e-903e-21b276bc5c1c	750ml	180	\N	CS000613	\N	2202	100	\N	PC	2026-03-26 16:37:30.129	2026-03-26 16:37:30.129
9e884b6c-7efe-4de7-a6a3-cf009c3d334d	65c26de7-4f01-454b-a710-9428643223b6	750ml	180	\N	CS000614	\N	2202	100	\N	PC	2026-03-26 16:37:30.129	2026-03-26 16:37:30.129
11cb3db1-786c-4a8d-9559-4d02d7885468	4e5b3339-12a7-4c21-b374-47759d095e82	750ml	180	\N	CS000615	\N	2202	100	\N	PC	2026-03-26 16:37:30.129	2026-03-26 16:37:30.129
dbbb5a2d-5f6f-4070-9824-4ec12440fbf4	6ed59274-c53f-4a04-b957-c1f4244c12c2	750ml	160	\N	CS000616	\N	2202	100	\N	PC	2026-03-26 16:37:30.13	2026-03-26 16:37:30.13
bf6d5b09-4813-4d6c-ad54-a7f8611b3db3	ec75f386-6249-4e73-8540-4bdab5f0d4d9	1L	122	\N	CS000617	\N	2202	100	\N	PC	2026-03-26 16:37:30.13	2026-03-26 16:37:30.13
b666bcdc-2dd6-4a5e-b5b1-7ef29474ca79	a0a5ce00-27ad-4dad-9d3b-b30d4593a222	750ml	160	\N	CS000618	\N	2202	100	\N	PC	2026-03-26 16:37:30.13	2026-03-26 16:37:30.13
18b6d02e-8dbb-4279-846e-87e47087ef8d	bae9ac84-a426-4c16-ba5b-f895d93e8b2d	Regular	480	\N	CS000619	\N	2106	20	\N	KG	2026-03-26 16:37:30.131	2026-03-26 16:37:30.131
f9e556b3-be73-4524-9f55-cee92403d8ff	4ed7f776-4df9-4631-a9c6-60befc4a1a17	Regular	600	\N	CS000620	\N	2106	20	\N	KG	2026-03-26 16:37:30.131	2026-03-26 16:37:30.131
77cc72d5-996e-459d-9a0f-901cdd7282ae	d795a800-31b3-4220-809f-89401d1b710f	Regular	480	\N	CS000621	\N	2106	20	\N	KG	2026-03-26 16:37:30.131	2026-03-26 16:37:30.131
ac3db7a2-0636-4d1b-824a-73ca4b2864aa	dac1857a-fb3e-4f57-abba-294b88809692	Regular	440	\N	CS000622	\N	0406	20	\N	KG	2026-03-26 16:37:30.132	2026-03-26 16:37:30.132
6fb0e249-e414-4686-aa6f-42be20b4921b	4bbcad90-fa58-4c5e-8881-7efb943fa6ba	Regular	140	\N	CS000623	\N	0403	20	\N	KG	2026-03-26 16:37:30.132	2026-03-26 16:37:30.132
14b853b2-3b0c-40af-acde-3bec7ec4ee8e	03bc80ac-7739-4c11-8de2-ff20fdd8be8a	Regular	350	\N	CS000624	\N	2106	20	\N	KG	2026-03-26 16:37:30.133	2026-03-26 16:37:30.133
821b12f1-ceef-40f9-9c94-3bb64080f2c8	cfae706b-516e-4203-8904-63e8faf2844f	Regular	40	\N	CS000625	\N	2202	100	\N	PC	2026-03-26 16:37:30.133	2026-03-26 16:37:30.133
87b5e2c4-fbea-44f9-b680-d77fbdde3456	ed7511a3-7c26-4189-ad0d-6a0612a986f5	Regular	20	\N	CS000626	\N	996331	100	\N	PC	2026-03-26 16:37:30.133	2026-03-26 16:37:30.133
ca51db09-582e-42fe-b745-3f268ec1403e	9eacfb3a-7aac-4fa9-8aa8-a9e78a14bac9	Regular	10	\N	CS000627	\N	1806	100	\N	PC	2026-03-26 16:37:30.134	2026-03-26 16:37:30.134
d54addf3-66af-414d-801f-1e79f81cbf3a	5d2a25de-9db7-45fc-8a17-bc8ef80a6c23	Regular	20	\N	CS000628	\N	1806	100	\N	PC	2026-03-26 16:37:30.134	2026-03-26 16:37:30.134
a81f2f2c-7e57-4a46-b2fc-c3597bddabba	85bd8cdc-2f49-492c-b675-a490d2bee92d	Regular	120	\N	CS000629	\N	0710	20	\N	KG	2026-03-26 16:37:30.134	2026-03-26 16:37:30.134
3756bb54-afe0-4f3f-8c30-fccdccc289ec	367be81d-6095-46a0-8302-73e618530d91	Regular	175	\N	CS000630	\N	2105	100	\N	PC	2026-03-26 16:37:30.135	2026-03-26 16:37:30.135
8826a3f1-7234-4904-8698-4b5d54a9f395	292fdf78-c388-4ffa-9152-de2f17aae5dd	Regular	120	\N	CS000631	\N	2105	100	\N	PC	2026-03-26 16:37:30.135	2026-03-26 16:37:30.135
364b9b09-b1e4-46be-b183-5abdeca2fd39	0e5c040d-fe6d-4153-8ccb-aaa5262340fa	Regular	140	\N	CS000632	\N	2105	100	\N	PC	2026-03-26 16:37:30.135	2026-03-26 16:37:30.135
a0472027-d91b-4232-a11e-9b8685b1cc6d	d49c8ecd-03fd-4e72-a5fb-f638b5ff26b1	Regular	135	\N	CS000633	\N	2105	100	\N	PC	2026-03-26 16:37:30.136	2026-03-26 16:37:30.136
f3e50727-6fe4-4f15-a9ad-d290babd7c8a	9eeda147-3a7e-46d6-b946-2b61c24ab012	Regular	175	\N	CS000634	\N	2105	100	\N	PC	2026-03-26 16:37:30.136	2026-03-26 16:37:30.136
3dbacbef-420b-482c-9f87-229760de9914	9c9c5e7e-0b0d-4ee5-88da-413c2c5a2ea0	Regular	20	\N	CS000635	\N	2202	100	\N	PC	2026-03-26 16:37:30.136	2026-03-26 16:37:30.136
23275bf7-b065-4dd4-8491-29b19cfa0abc	c1007e31-dffd-411a-814f-cd0eecd020c4	Regular	110	\N	CS000636	\N	2105	100	\N	PC	2026-03-26 16:37:30.136	2026-03-26 16:37:30.136
025964c2-6dba-43bd-8046-03b74e1dca24	46982de1-8cb1-482d-972b-fdde06c6141e	Regular	70	\N	CS000637	\N	4823	100	\N	PC	2026-03-26 16:37:30.137	2026-03-26 16:37:30.137
07f9f960-cc9a-464b-8693-c38bad23d9cc	c2fbfca4-5226-434f-a2ee-503d3d651d08	Regular	20	\N	CS000638	\N	1905	100	\N	PC	2026-03-26 16:37:30.137	2026-03-26 16:37:30.137
7e10a44f-ac6e-4571-b8fe-f3a5fa1877b2	803c47b4-32c7-481d-843a-3334144640fb	Regular	80	\N	CS000639	\N	4823	100	\N	PC	2026-03-26 16:37:30.137	2026-03-26 16:37:30.137
c08d64d3-265b-4891-997f-934907ef05c7	4234cc96-8cd0-44d9-ac31-faee97d2d9fa	Regular	100	\N	CS000640	\N	4823	100	\N	PC	2026-03-26 16:37:30.137	2026-03-26 16:37:30.137
f6564a96-9c9f-407c-9538-d3b418d72b34	cc0fa830-6374-40f1-b369-f621d7843a98	250ml	20	\N	CS000641	\N	2202	100	\N	PC	2026-03-26 16:37:30.138	2026-03-26 16:37:30.138
afa36da5-eaaa-4d63-b174-1fe39496fdd0	d479032b-197d-43bc-9d64-227028f34365	Regular	20	\N	CS000642	\N	2202	100	\N	PC	2026-03-26 16:37:30.138	2026-03-26 16:37:30.138
f4cd09e0-9ee5-48cc-8efb-304f2116fb6d	3463231c-0017-4311-bb8e-60a43910b4c1	Regular	100	\N	CS000643	\N	3924	100	\N	PC	2026-03-26 16:37:30.138	2026-03-26 16:37:30.138
57e0b751-5449-4e55-914c-633c19c3e99c	eced7e5d-a0e9-48a3-9531-e7e69ca3d196	Regular	360	\N	CS000644	\N	2106	20	\N	KG	2026-03-26 16:37:30.139	2026-03-26 16:37:30.139
af63e215-1504-4e35-9ca8-b3eed380ed21	4d0a4720-d347-44bb-98aa-ee428912b932	Regular	1200	\N	CS000645	\N	2106	20	\N	KG	2026-03-26 16:37:30.139	2026-03-26 16:37:30.139
67dd3fe3-8a08-4dbf-9833-1618f1ea4b6b	943dbeb2-e6d7-4f40-bb59-e8ef3663abc6	750ml	20	\N	CS000646	\N	2201	100	\N	PC	2026-03-26 16:37:30.139	2026-03-26 16:37:30.139
d4b59a8a-1ef0-4207-a192-23b53961aff2	d0a34b83-6aac-4c4c-a2cf-c2997419f89f	Regular	560	\N	CS000647	\N	2106	20	\N	KG	2026-03-26 16:37:30.139	2026-03-26 16:37:30.139
f2c51e9f-d0e8-45ff-a515-58feafe215c8	7a000793-b639-4795-b908-3f90aeac9f99	500ml	220	\N	CS000648	\N	2201	100	\N	PC	2026-03-26 16:37:30.14	2026-03-26 16:37:30.14
086d5ac9-c042-4c70-8995-8fa8c45e7ccb	f4164d59-59a8-4a4f-a0e9-1432ffe1be0d	Regular	560	\N	CS000649	\N	2106	20	\N	KG	2026-03-26 16:37:30.14	2026-03-26 16:37:30.14
de5086cc-397d-4593-ab22-494fd0da4c95	68f4329a-10f7-486c-af35-af24ce523a26	Regular	600	\N	CS000650	\N	2106	20	\N	KG	2026-03-26 16:37:30.14	2026-03-26 16:37:30.14
0d2433b6-638d-472c-af63-6c26d2c1f49b	78383789-46af-419c-b4ca-156aca1d11e3	Regular	440	\N	CS000651	\N	2106	20	\N	KG	2026-03-26 16:37:30.14	2026-03-26 16:37:30.14
962e99cd-df63-45e0-ba9d-dae3dbd617dd	78bff725-9cf6-445d-bd5b-6cf73b571df8	Regular	520	\N	CS000652	\N	2106	20	\N	KG	2026-03-26 16:37:30.141	2026-03-26 16:37:30.141
357099b9-6ca0-4d07-8105-3b9f53279df4	90e5f036-eaa2-4e97-8c4f-418a3c1b3c9c	Regular	640	\N	CS000653	\N	2106	20	\N	KG	2026-03-26 16:37:30.141	2026-03-26 16:37:30.141
4d3a44ca-118f-411d-acd4-96f6fe5d3db8	606c3d2d-4163-487e-b11e-ded69c198617	Regular	520	\N	CS000654	\N	2106	20	\N	KG	2026-03-26 16:37:30.141	2026-03-26 16:37:30.141
8a4be5cc-80c1-406b-b002-0c68a6f5208e	a0c18532-b27d-4259-9c3a-94c0b70fbaae	900g	215	\N	CS000655	\N	2106	100	\N	PC	2026-03-26 16:37:30.142	2026-03-26 16:37:30.142
a3d0b120-42de-4a6f-b88f-adc0a2302ba9	377eca6f-a88f-473a-bcdd-9048af32daf2	200g	89	\N	CS000656	\N	2106	100	\N	PC	2026-03-26 16:37:30.142	2026-03-26 16:37:30.142
eb03dfec-8f86-4cc9-9a4c-20b2cc53ee70	a0c18532-b27d-4259-9c3a-94c0b70fbaae	400g	160	\N	CS000657	\N	2106	100	\N	PC	2026-03-26 16:37:30.142	2026-03-26 16:37:30.142
ae285a09-661c-47ba-9948-dda74b596a70	de92b7e6-2997-4ee1-8c29-ffb927c382cd	2kg	225	\N	CS000658	\N	2103	100	\N	PC	2026-03-26 16:37:30.143	2026-03-26 16:37:30.143
cce50c1d-683f-456d-9b43-ba52a90f0bf8	cf45e6fd-75a2-411b-8d71-503372510fdd	250g	80	\N	CS000659	\N	2106	100	\N	PC	2026-03-26 16:37:30.143	2026-03-26 16:37:30.143
92a432cb-2303-450a-9cbe-fe1c5dbcb5f5	a22212ea-6cd6-46b1-9935-360ad0519baf	200g	55	\N	CS000660	\N	2106	100	\N	PC	2026-03-26 16:37:30.143	2026-03-26 16:37:30.143
f9396a60-4d94-461c-aa09-3ee1dfb5015a	5de5c15f-c2dd-4ba5-9046-94960166e737	200g	89	\N	CS000661	\N	2106	100	\N	PC	2026-03-26 16:37:30.143	2026-03-26 16:37:30.143
4646cb76-1abf-464b-b806-6f9d32ccec6b	07674ef6-4ee7-489f-adb2-2ca03b97cd59	200g	55	\N	CS000662	\N	2106	100	\N	PC	2026-03-26 16:37:30.144	2026-03-26 16:37:30.144
8a709dc8-91b4-4b02-817f-e389876dc6c6	9827a8df-fade-4f81-bb01-449c34282255	200g	45	\N	CS000663	\N	2106	100	\N	PC	2026-03-26 16:37:30.144	2026-03-26 16:37:30.144
0d2d1861-2598-40a3-a12e-bfc91149e8fa	9827a8df-fade-4f81-bb01-449c34282255	400g	88	\N	CS000664	\N	2106	100	\N	PC	2026-03-26 16:37:30.144	2026-03-26 16:37:30.144
d721cec1-2baa-4feb-b9a6-641cfef5872e	07674ef6-4ee7-489f-adb2-2ca03b97cd59	400g	95	\N	CS000665	\N	2106	100	\N	PC	2026-03-26 16:37:30.144	2026-03-26 16:37:30.144
37a27e20-faa8-4e30-be2f-993049c95217	78a57841-a129-4089-befa-47eddf619b35	Regular	35	\N	CS000666	\N	1704	100	\N	PC	2026-03-26 16:37:30.145	2026-03-26 16:37:30.145
66ace7b6-c1c2-433a-850c-bcea387ab03c	5963a6e1-7f9f-433c-b962-d48d56d019c4	200g	45	\N	CS000667	\N	2106	100	\N	PC	2026-03-26 16:37:30.145	2026-03-26 16:37:30.145
7b2ba712-7d76-42d2-9fbb-a80043792758	487fd724-d726-4b2e-92b1-95362f6be7d7	Regular	20	\N	CS000668	\N	1704	100	\N	PC	2026-03-26 16:37:30.145	2026-03-26 16:37:30.145
0ab8ffbe-09b7-4206-aac7-ff2c9165e350	3b188989-6017-4e98-8223-f7065ef5fa2e	Regular	30	\N	CS000669	\N	2105	100	\N	PC	2026-03-26 16:37:30.146	2026-03-26 16:37:30.146
b505f668-8330-4bfd-98d6-c362d6e7fe88	182f1b3d-4bfe-411d-8e19-2bae97993022	Regular	20	\N	CS000670	\N	2105	100	\N	PC	2026-03-26 16:37:30.146	2026-03-26 16:37:30.146
669b7081-46d9-4d34-8525-4b0626e5d7c2	4638056a-b816-418d-be7e-7862124cb3bc	Regular	20	\N	CS000671	\N	2105	100	\N	PC	2026-03-26 16:37:30.146	2026-03-26 16:37:30.146
06afe002-4828-451d-ae08-4e8e29a2c9e7	1b640fae-29e5-4933-9c84-c6cb7c7e09d0	Regular	40	\N	CS000672	\N	1704	100	\N	PC	2026-03-26 16:37:30.146	2026-03-26 16:37:30.146
5c1e8f5e-ff3c-4375-959e-39ef1bc48c7e	c56996c8-3293-44c0-8e43-bf444b053cf1	100g	75	\N	CS000673	\N	2106	100	\N	PC	2026-03-26 16:37:30.147	2026-03-26 16:37:30.147
7a142d48-3e6f-49d8-9bfa-fbd8b15ee1d5	b3af3199-5210-4795-be2d-7a07e0c0836c	180g	80	\N	CS000674	\N	2106	100	\N	PC	2026-03-26 16:37:30.147	2026-03-26 16:37:30.147
0266cec0-8efb-4a1b-9c8c-6ae485f20548	240ad075-3ecd-45bb-adc3-c7778a36df23	180g	75	\N	CS000675	\N	2106	100	\N	PC	2026-03-26 16:37:30.147	2026-03-26 16:37:30.147
0ac17025-1a11-4c64-b198-e7b2fd9642b9	2a5b72ba-e377-4d57-9d21-e92651194f58	160g	60	\N	CS000676	\N	2106	100	\N	PC	2026-03-26 16:37:30.147	2026-03-26 16:37:30.147
fba27ce7-5ce1-466f-bd47-5d146599d33b	22ecd126-9dfa-4308-83e8-9821dff57156	Regular	95	\N	CS000677	\N	2106	100	\N	PC	2026-03-26 16:37:30.148	2026-03-26 16:37:30.148
0291bbec-f2c1-4879-8dbc-e88c580f0151	1de6d49b-1676-4f44-981a-2c77f14b7702	500g	100	\N	CS000678	\N	2106	100	\N	PC	2026-03-26 16:37:30.148	2026-03-26 16:37:30.148
4ccb330f-304a-4e68-affe-dc2ccae117ff	5331eeab-09e5-46a3-a797-fd385710c91c	100g	55	\N	CS000679	\N	2106	100	\N	PC	2026-03-26 16:37:30.148	2026-03-26 16:37:30.148
406cf748-72ca-4ecd-8933-c497d85a8d8a	e2ef3141-38fd-4978-a84b-d5732d6e92ce	250g	60	\N	CS000680	\N	2106	100	\N	PC	2026-03-26 16:37:30.148	2026-03-26 16:37:30.148
7de14c99-17e1-41d2-ad5c-c541ba66ead9	6b1f32a6-292b-45c4-b725-10fb9151887c	120g	90	\N	CS000681	\N	1704	100	\N	PC	2026-03-26 16:37:30.149	2026-03-26 16:37:30.149
98215c09-3291-4b37-8f02-3d2c3891fea7	7358b8d1-ca1e-450a-8913-3acc3e82f699	120g	95	\N	CS000682	\N	2106	100	\N	PC	2026-03-26 16:37:30.149	2026-03-26 16:37:30.149
c5f410cc-5faa-40e5-ac46-6c41b023b411	16c060b1-2ee2-46a4-99d0-5165d2dc1725	135g	85	\N	CS000683	\N	1704	100	\N	PC	2026-03-26 16:37:30.149	2026-03-26 16:37:30.149
4f1cfed6-1430-4893-b3ac-7bb2ced49468	d51e5c0d-32b9-4e96-b273-c0fb9600cb08	80g	90	\N	CS000684	\N	1704	100	\N	PC	2026-03-26 16:37:30.15	2026-03-26 16:37:30.15
cdb3cad6-8817-4b2f-b8b0-21f962d39657	d21a7712-fa9b-4812-8b4f-176e63fb479d	Regular	520	\N	CS000685	\N	2106	20	\N	KG	2026-03-26 16:37:30.15	2026-03-26 16:37:30.15
10994d4e-9c19-4137-a98f-a46e1dc9d03d	5fb3b2a5-e1fd-477a-8473-b938da517956	Regular	560	\N	CS000686	\N	2106	20	\N	KG	2026-03-26 16:37:30.15	2026-03-26 16:37:30.15
6557e1e5-feed-4151-ace9-a4f459f1c2af	d57daa7a-87fe-4ca0-8afa-31e5da5f85d8	Regular	560	\N	CS000687	\N	2106	20	\N	KG	2026-03-26 16:37:30.15	2026-03-26 16:37:30.15
73c073bb-0876-4b29-ae71-a32d80068c75	a2e2162d-2b1b-4075-8107-30d989ac6eee	Regular	480	\N	CS000688	\N	2106	20	\N	KG	2026-03-26 16:37:30.151	2026-03-26 16:37:30.151
31032c8f-26af-4fa7-ad68-31b4381f6f55	d8f6a1f8-7fc5-4b0b-883b-f2f07fc4a534	Regular	560	\N	CS000689	\N	2106	20	\N	KG	2026-03-26 16:37:30.151	2026-03-26 16:37:30.151
0537610c-2784-4305-b6aa-e01e646b2224	805a2a1e-31a0-4624-a4aa-036f2e8c94e1	Regular	360	\N	CS000690	\N	2106	20	\N	KG	2026-03-26 16:37:30.151	2026-03-26 16:37:30.151
c0630219-acaf-4b35-bc81-615775df8482	e4c0e7a7-8807-426c-837e-6285c2c95f4e	Regular	300	\N	CS000691	\N	1702	20	\N	KG	2026-03-26 16:37:30.152	2026-03-26 16:37:30.152
16185d56-ffbc-4ac0-a35b-d9a06720ef1a	886ac1c5-e2db-4ad6-9542-6cac7302cb44	Regular	320	\N	CS000692	\N	1701	20	\N	KG	2026-03-26 16:37:30.152	2026-03-26 16:37:30.152
f9f1e2cd-ab2d-47cb-9428-4a17e5b5d8f7	6133e8b1-5077-4953-9438-adeb72824336	Regular	43	\N	CS000693	\N	2106	20	\N	KG	2026-03-26 16:37:30.152	2026-03-26 16:37:30.152
f9d048c6-828f-4ede-a95d-fca1719c3632	ecaf0a02-f0cc-4c26-b0df-1efcd0d87ac8	Regular	399	\N	CS000694	\N	2202	100	\N	PC	2026-03-26 16:37:30.153	2026-03-26 16:37:30.153
2096b6f4-7b5f-4295-a942-54866c6e12fb	059cec99-8f4a-4523-a3e8-dedbc4eb625a	250g	130	\N	CS000695	\N	1905	100	\N	PC	2026-03-26 16:37:30.153	2026-03-26 16:37:30.153
3c2d5996-5b21-4036-85da-81e8ddffd6bd	f2a6bca5-7363-43fd-a7fc-d11901877fab	Regular	20	\N	CS000696	\N	1905	100	\N	PC	2026-03-26 16:37:30.153	2026-03-26 16:37:30.153
ff959753-1ddf-4134-840b-4cb6e95274ef	404c1051-7e78-4c97-83c3-977d8865932e	Regular	1	\N	CS000697	\N	2103	100	\N	PC	2026-03-26 16:37:30.153	2026-03-26 16:37:30.153
963e1ff8-6204-43bb-a7cc-b0644e03cbbd	99ebecf5-24c4-470a-b443-88d791da357a	100g	44	\N	CS000698	\N	2106	100	\N	PC	2026-03-26 16:37:30.154	2026-03-26 16:37:30.154
d6b49458-7a9c-41b5-a25b-bc102b57b220	80ee3ebd-731b-452d-b0c5-1f15b1fc0543	500g	175	\N	CS000699	\N	2106	100	\N	PC	2026-03-26 16:37:30.154	2026-03-26 16:37:30.154
00615d63-cd0b-40ee-ba97-73508e359e93	80ee3ebd-731b-452d-b0c5-1f15b1fc0543	100g	44	\N	CS000700	\N	2106	100	\N	PC	2026-03-26 16:37:30.154	2026-03-26 16:37:30.154
315ab393-8fbc-4aa1-80fc-1dcd3df48f25	99ebecf5-24c4-470a-b443-88d791da357a	500g	175	\N	CS000701	\N	2106	100	\N	PC	2026-03-26 16:37:30.154	2026-03-26 16:37:30.154
f0a87064-4f40-4e8e-ae2b-b477dd941607	97eb351d-8ad5-4887-ad48-d4d87a05cb00	Regular	50	\N	CS000702	\N	2106	100	\N	PC	2026-03-26 16:37:30.155	2026-03-26 16:37:30.155
3f0d9ae6-09aa-47e7-9da9-c01e52c57127	e2327aab-5589-4c2f-b8ed-aecad64c2494	Regular	60	\N	CS000703	\N	2106	100	\N	PC	2026-03-26 16:37:30.155	2026-03-26 16:37:30.155
56d6b5b2-fe53-4ec5-9ec8-4a080286d9dd	981ec52e-b647-4330-ad57-a4aaeb1beb7e	Regular	480	\N	CS000704	\N	2106	20	\N	KG	2026-03-26 16:37:30.155	2026-03-26 16:37:30.155
c3942cfe-2c14-4e45-9fb4-028d35d99775	2cd1e4b0-5a18-4fd8-9039-b984c83aea10	Regular	60	\N	CS000705	\N	2106	100	\N	PC	2026-03-26 16:37:30.155	2026-03-26 16:37:30.155
7226ffbf-a88d-4cab-8f02-3bf0542978da	77aa6a3d-802b-4a85-a6e6-b6bf86abde31	100g	60	\N	CS000706	\N	2106	100	\N	PC	2026-03-26 16:37:30.156	2026-03-26 16:37:30.156
dcb4fed0-4063-4058-994d-71dc9bc99d07	7830f5b1-acb9-4ed9-9fda-3a8017286c5f	100g	35	\N	CS000707	\N	2106	100	\N	PC	2026-03-26 16:37:30.156	2026-03-26 16:37:30.156
38c08637-c76f-4e5e-b92e-1f0e8f01effa	1ef66db8-8117-45e2-94ed-0945106a0dec	100g	40	\N	CS000708	\N	2106	100	\N	PC	2026-03-26 16:37:30.156	2026-03-26 16:37:30.156
636f90b8-2031-4995-8875-43550f9b31e5	f35d81ca-e15b-4931-9e90-8fb3168406c5	Regular	50	\N	CS000709	\N	2106	100	\N	PC	2026-03-26 16:37:30.157	2026-03-26 16:37:30.157
5b3fc6fc-442a-4fc3-b6e1-3c2ab9a8dfe4	59910763-7087-4f02-851c-0087fba0ad9e	Regular	50	\N	CS000710	\N	2106	100	\N	PC	2026-03-26 16:37:30.157	2026-03-26 16:37:30.157
0125e32f-3a5c-4918-8a36-24973fcc654e	b595104c-3ba3-44a0-aa34-e4f233098c6f	Regular	60	\N	CS000711	\N	2106	100	\N	PC	2026-03-26 16:37:30.157	2026-03-26 16:37:30.157
646e14b2-69c3-4a3c-86e3-d08ac2ce6bcc	403a4bb2-aa5e-4c01-9359-2005df64a4aa	Regular	15	\N	CS000712	\N	996331	100	\N	PC	2026-03-26 16:37:30.157	2026-03-26 16:37:30.157
5ee86f4b-8833-4c2b-b0e1-61a5a8c2d828	d3aed07d-3e44-4d5a-9895-7b00c28ffa05	Regular	35	\N	CS000713	\N	996331	100	\N	PC	2026-03-26 16:37:30.158	2026-03-26 16:37:30.158
ee58e269-5ecb-4e1e-baa0-d440deaed9ff	69a247c9-ea64-409d-874f-2ea1a39f42c3	Regular	60	\N	CS000714	\N	2106	100	\N	PC	2026-03-26 16:37:30.158	2026-03-26 16:37:30.158
6650ab65-f31f-4767-903a-b3c63692e213	cda414f0-651e-4259-8b71-ac49b408f588	Regular	85	\N	CS000715	\N	2106	100	\N	PC	2026-03-26 16:37:30.158	2026-03-26 16:37:30.158
11d9abed-2544-44aa-9ecc-577a65ac655b	07b246fb-379f-4e6b-a0f5-48cebc2f5f38	350g	95	\N	CS000716	\N	2106	100	\N	PC	2026-03-26 16:37:30.158	2026-03-26 16:37:30.158
30eb6090-3ff5-457e-86a8-346aad75cd25	e8dfaee8-7e1f-49b6-ad72-21b66c42a1b6	250g	75	\N	CS000717	\N	2106	100	\N	PC	2026-03-26 16:37:30.159	2026-03-26 16:37:30.159
\.


--
-- Data for Name: RoleRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."RoleRequest" (id, "userId", "shopCode", "requestedRole", status, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Shop; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Shop" (id, name, address, "createdAt", "shopCode", city, country, currency, email, "gstNumber", phone, pincode, state, "updatedAt", "upiId", "allowBookingWhenOutOfStock", "allowNextDayBooking") FROM stdin;
74058443-d2f0-490a-b67a-858129911604	Calcutta Sweets	Raipur, Chattisgarh	2026-03-23 17:34:02.128	SH000001	\N	\N	INR	support@calcuttasweets.com	\N	\N	\N	\N	2026-03-23 17:35:44.458	\N	f	f
ade35672-b86c-4357-8164-eaf77371387e	Calcutta Sweets	\N	2026-03-26 16:35:55.412	calcutta-main	\N	\N	INR	\N	\N	\N	\N	\N	2026-03-26 16:35:55.412	\N	f	f
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, password, "shopCode", "avatarUrl", "createdAt", "isActive", name, "updatedAt", role, phone) FROM stdin;
6c968458-6a81-414f-9bb3-4761d30c3728	gaurav.singh@gmail.com	test123	SH000001	\N	2026-03-28 13:07:19.585	t	Gaurav	2026-03-29 17:41:43.097	STAFF	\N
6fbfdcf2-a248-45e3-a252-9963caa0e953	thakurgaurav273@gmail.com	test1234	SH000001	https://res.cloudinary.com/dguypvr3u/image/upload/v1775756693/c37orcjezgztt9vhywxm.jpg	2026-03-23 17:36:26.317	t	Gaurav Singh	2026-04-09 17:44:55.784	SUPER_ADMIN	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
63137b68-ab0f-4fdf-bcbf-20a0410c973e	65e1b15e1a2f5de79569a6f12a5af0a8e97bc51d38e0bed8dd9a295089de6734	2026-03-23 23:02:48.645532+05:30	20260314142245_init	\N	\N	2026-03-23 23:02:48.635776+05:30	1
7bce6919-5974-4f48-b3a8-490a4dd9fdaa	8f33b059bc46c80f66ad3fc1602fe2eab4b51f5351ce598534e5515b3f890edb	2026-03-23 23:02:48.647841+05:30	20260314161910_added_shop_code	\N	\N	2026-03-23 23:02:48.645867+05:30	1
ebb44b89-87f0-4c92-b078-66e8503e13b8	c812243f413963eb1802bea57cf004289dbbfad28ca0d9513c52124cb708af87	2026-03-23 23:02:48.651246+05:30	20260314162800_added_shop_code	\N	\N	2026-03-23 23:02:48.64828+05:30	1
edb79bdb-db71-4058-aec1-86c1ce108071	45d711189ccca18f9e1ead225b210023b2680fcb8fea39c4fe68408e0a18d775	2026-03-23 23:02:48.654327+05:30	20260314163107_added_shop_code	\N	\N	2026-03-23 23:02:48.651533+05:30	1
1e33e0e5-5e60-447e-b30e-260c5aa92312	8404236b0cc509c3a9b509c99a54c053409c8196f1887eb639b0e5d201bd83d3	2026-03-23 23:02:51.61113+05:30	20260323173251_init	\N	\N	2026-03-23 23:02:51.603591+05:30	1
eb410fa5-3984-4cd4-bdf8-a4da473f2710	6d56edf6c0f7cfb64cf06f7216f5ab8377a96b8b571b574a148c0e1dcd175905	2026-03-26 21:09:53.9801+05:30	20260326153953_init	\N	\N	2026-03-26 21:09:53.961218+05:30	1
91b5f67c-0a96-4f13-8478-302687bf6371	60908babad567484947ea58679878b53baae4d50c6842f18f6028bcd7e6dc082	2026-03-26 21:56:05.717089+05:30	20260326162605_init	\N	\N	2026-03-26 21:56:05.710122+05:30	1
c0ff916f-200c-422f-a252-dec06338f292	db66027f11150ef38c3c469462b95cde808d53fe93d30528becfd8240827b43e	2026-03-29 14:11:30.842636+05:30	20260328194500_order_pos_payment_variant	\N	\N	2026-03-29 14:11:30.826544+05:30	1
\.


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: OrderItem OrderItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_pkey" PRIMARY KEY (id);


--
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- Name: ProductImage ProductImage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_pkey" PRIMARY KEY (id);


--
-- Name: ProductVariant ProductVariant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_pkey" PRIMARY KEY (id);


--
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- Name: RoleRequest RoleRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RoleRequest"
    ADD CONSTRAINT "RoleRequest_pkey" PRIMARY KEY (id);


--
-- Name: Shop Shop_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Shop"
    ADD CONSTRAINT "Shop_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Category_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Category_name_key" ON public."Category" USING btree (name);


--
-- Name: ProductVariant_barcode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "ProductVariant_barcode_key" ON public."ProductVariant" USING btree (barcode);


--
-- Name: Shop_shopCode_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Shop_shopCode_key" ON public."Shop" USING btree ("shopCode");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: OrderItem OrderItem_orderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES public."Order"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OrderItem OrderItem_productVariantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OrderItem"
    ADD CONSTRAINT "OrderItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES public."ProductVariant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Order Order_shopCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES public."Shop"("shopCode") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductImage ProductImage_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductImage"
    ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProductVariant ProductVariant_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ProductVariant"
    ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."Product"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Product Product_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Product Product_shopCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES public."Shop"("shopCode") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RoleRequest RoleRequest_shopCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RoleRequest"
    ADD CONSTRAINT "RoleRequest_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES public."Shop"("shopCode") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RoleRequest RoleRequest_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."RoleRequest"
    ADD CONSTRAINT "RoleRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_shopCode_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_shopCode_fkey" FOREIGN KEY ("shopCode") REFERENCES public."Shop"("shopCode") ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict Zrw89iGIBnsoXA9Yw3JQI2Hp86WDwyUhif3jcgDpOJhUBin5zI7ZMbN2DtDMcmG

