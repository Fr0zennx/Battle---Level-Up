import { motion } from "framer-motion"
import { CSSProperties } from "react"

interface Word {
  text: string
  className?: string
  style?: CSSProperties
}

interface TypewriterEffectProps {
  words: Word[]
  className?: string
  cursorClassName?: string
}

export const TypewriterEffectSmooth = ({
  words,
  className,
  cursorClassName,
}: TypewriterEffectProps) => {
  const wordsArray = words.map((word) => ({
    ...word,
    text: word.text.split(""),
  }))

  const renderWords = () => (
    <div>
      {wordsArray.map((word, idx) => (
        <div key={`word-${idx}`} style={{ display: 'inline-block' }}>
          {word.text.map((char, index) => (
            <span
              key={`char-${index}`}
              className={word.className}
              style={word.style}
            >
              {char}
            </span>
          ))}
          {idx < wordsArray.length - 1 && <span>&nbsp;</span>}
        </div>
      ))}
    </div>
  )

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center' }}>
      <motion.div
        style={{ overflow: 'hidden', paddingBottom: '8px' }}
        initial={{ width: "0%" }}
        animate={{ width: "fit-content" }}
        transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1], delay: 0.3 }}
      >
        <div style={{ 
          fontSize: 'inherit', 
          fontWeight: 'inherit', 
          whiteSpace: 'nowrap'
        }}>
          {renderWords()}
        </div>
      </motion.div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
        className={cursorClassName}
        style={{
          display: 'inline-block',
          width: '4px',
          height: '1em',
          background: 'linear-gradient(to bottom, #dc2626, #f59e0b)',
          marginLeft: '4px',
          borderRadius: '2px'
        }}
      />
    </div>
  )
}

// Harflerin sırayla açıldığı typewriter efekti
export const TypewriterText = ({
  text,
  className,
  style,
  delay = 0.3,
  charDelay = 0.05,
}: {
  text: string
  className?: string
  style?: CSSProperties
  delay?: number
  charDelay?: number
}) => {
  const characters = text.split("")
  const totalDuration = characters.length * charDelay

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex' }}>
        {characters.map((char, index) => (
          <motion.span
            key={index}
            className={className}
            style={{ ...style, display: 'inline-block' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.3,
              delay: delay + index * charDelay,
              ease: "easeOut"
            }}
          >
            {char === " " ? "\u00A0" : char}
          </motion.span>
        ))}
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse", delay: delay + totalDuration }}
        style={{
          display: 'inline-block',
          width: '3px',
          height: '0.8em',
          background: 'linear-gradient(to bottom, #dc2626, #f59e0b)',
          marginLeft: '4px',
          borderRadius: '2px'
        }}
      />
    </div>
  )
}
