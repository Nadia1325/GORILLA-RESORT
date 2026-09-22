"use client";

import { motion } from "framer-motion";
import SearchWidget from "./SearchWidget";

export default function Hero() {
  return (
    <section id="top" className="relative">

      <div className="relative h-[100svh] min-h-[540px] w-full overflow-hidden sm:h-[92vh] sm:min-h-[630px]">


        {/* Background Cinematic Zoom */}
        <motion.img
          src="/pages.png"
          alt="Mount Sabyinyo and the Volcanoes National Park landscape in Rwanda"
          className="absolute inset-0 h-full w-full object-cover"
          initial={{
            scale: 1.15,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            duration: 12,
            ease: "easeOut",
          }}
        />


        {/* Animated Dark Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-tide-950/90 via-tide-900/40 to-tide-900/60 dark:from-tide-950 dark:via-tide-950/55 dark:to-tide-950/70"
          animate={{
            opacity: [0.85, 1, 0.85],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />


        <div className="absolute inset-0 bg-gradient-to-r from-tide-900/40 via-transparent to-transparent" />



        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 pb-32 pt-24 sm:px-6 sm:pb-28 lg:px-10">



          {/* LOCATION ANIMATION */}
          <motion.div
            className="eyebrow flex items-center gap-3 text-sand-100/90"
            initial={{
              opacity: 0,
              y: 30,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
            }}
          >

            <motion.span
              className="h-px w-8 bg-sand-100/60"
              animate={{
                width: [
                  "32px",
                  "60px",
                  "32px",
                ],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            <motion.span
              animate={{
                opacity: [
                  0.7,
                  1,
                  0.7,
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              Kinigi, Musanze · gateway to Volcanoes National Park
            </motion.span>

          </motion.div>





          {/* MAIN TITLE */}
          <motion.h1
            className="mt-6 max-w-2xl font-display text-4xl font-medium leading-[1.08] text-sand-50 sm:text-6xl lg:text-7xl"
            initial={{
              opacity: 0,
              y: 60,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1.2,
              delay: 0.2,
              ease: "easeOut",
            }}
          >

            Gorilla Recreational

            <br />


            <motion.span
              className="inline-block italic text-gold-300"
              animate={{
                y: [
                  0,
                  -12,
                  0,
                ],

                opacity: [
                  0.85,
                  1,
                  0.85,
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              resort.
            </motion.span>


          </motion.h1>






          {/* DESCRIPTION */}
          <motion.p
            className="mt-6 max-w-md text-base leading-relaxed text-sand-100/85 sm:text-lg"
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.5,
            }}
          >
            Gorilla Recreational Resort sits at the foot of the Virunga range
            in Musanze, Rwanda — five rooms, each named for the volcano it
            looks toward.
          </motion.p>






          {/* BUTTONS */}
          <motion.div
            className="mt-9 flex flex-wrap items-center gap-4"
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 1,
              delay: 0.7,
            }}
          >


            <motion.a
              href="#rooms"
              className="btn-primary"
              whileHover={{
                scale: 1.08,
              }}
              whileTap={{
                scale: 0.95,
              }}
            >
              View our rooms
            </motion.a>




            <motion.a
              href="#experiences"
              className="inline-flex items-center gap-2 text-sm font-semibold text-sand-50/90 underline decoration-sand-50/30 underline-offset-4 transition hover:decoration-sand-50"
              whileHover={{
                x: 10,
              }}
            >
              Plan a gorilla trek
            </motion.a>


          </motion.div>



        </div>

      </div>





      {/* SEARCH BOX FLOATING */}
      <motion.div
        className="relative z-20 mx-auto -mt-16 max-w-7xl px-4 sm:-mt-14 sm:px-6 lg:px-10"
        initial={{
          opacity: 0,
          y: 100,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 1,
          delay: 1,
        }}
      >

        <SearchWidget />

      </motion.div>


    </section>
  );
}