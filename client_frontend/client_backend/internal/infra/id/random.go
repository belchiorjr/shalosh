package id

import (
	"crypto/rand"
	"encoding/binary"
	"encoding/hex"
	"time"
)

type Random struct{}

func New() Random {
	return Random{}
}

func (Random) NewID() string {
	buf := make([]byte, 16)
	if _, err := rand.Read(buf); err == nil {
		return hex.EncodeToString(buf)
	}
	fallback := make([]byte, 8)
	binary.BigEndian.PutUint64(fallback, uint64(time.Now().UnixNano()))
	return hex.EncodeToString(fallback)
}
